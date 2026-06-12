import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores } from "./scoring";
import { departments } from "./departments";
import * as fs from "fs";

const M = parseInt(process.argv[2] || "10000", 10);
const DATE = "2026-06-09";
const GATE = 3.0;          // ゲート罰の強さ
const ESS = 0.8;           // ターゲット≥ESS = 必須軸
const REQ_MARGIN = 0.15;   // 必須軸で (target - margin) を下回ると罰
const GAMMA = 0.7;         // wL2_var の分散重み指数
const EPS = 1e-9;
const MEASURED: Record<string, number[]> = {
  mixed: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
  sciences: [0,1,2,3,4,5,7,10,11,12,13,14,15,18],
};
const CHEM = new Set(["chemistry","applied-chem","life-chem","chem-eng"]);
function clamp(v:number){return v<1?1:v>5?5:v;}
function genAns(q:any,t:number){const ideal=q.reverse?(1+4*(1-t)):(1+4*t);return clamp(Math.round(ideal+(((Math.random()*3)|0)-1)));}
// 近miss: 必須軸に効く質問だけ低く倒す
function genNearMiss(q:any,t:number,essAx:Set<number>){
  if(essAx.has(q.axisIndex)) return q.reverse?5:1;  // その軸を低くする回答
  return genAns(q,t);
}

const versions:Version[]=["mixed","sciences"];
let md=`# 必須軸ゲーティング検証：偽物を弾けるか（${M.toLocaleString()}人/学科）\n\n`;
md+=`**生成日**: ${DATE}\n**ゲート**: ターゲット≥${ESS}の軸を「必須」とし、受験生がそこで(target-${REQ_MARGIN})を下回るとベーススコアに大きな罰。\n`;
md+=`**指標**: 復元率=本物の理想受験生をtop1に出せた率。**棄却率=必須軸を欠いた"偽物"をtop1から外せた率（高いほど良い）**。\n\n`;

for(const v of versions){
  const questions=getQuestionsForVersion(v);
  const ax=MEASURED[v];
  const fd=departments.filter((d:any)=>!d.versions||d.versions.includes(v));
  const D=fd.length;
  // 分散重み
  const std=new Array(19).fill(0);
  for(const i of ax){let m=0;for(const d of fd)m+=d.scores[i];m/=D;let s=0;for(const d of fd)s+=(d.scores[i]-m)**2;std[i]=Math.sqrt(s/D);}
  const w=(i:number)=>Math.pow(std[i]+EPS,GAMMA);
  // 各学科の必須軸
  const ess=fd.map((d:any)=>new Set(ax.filter(i=>d.scores[i]>=ESS)));
  const essQ=fd.map((d:any,di:number)=>{const s=new Set<number>();for(const i of ess[di])s.add(i);return s;});

  function wdist(x:number[],d:any){let s=0;for(const i of ax)s+=w(i)*(x[i]-d.scores[i])**2;return Math.sqrt(s);}
  function cos(x:number[],d:any){let dt=0,a=0,b=0;for(const i of ax){dt+=x[i]*d.scores[i];a+=x[i]*x[i];b+=d.scores[i]*d.scores[i];}return (a<EPS||b<EPS)?0:dt/Math.sqrt(a*b);}
  function gate(x:number[],di:number){let p=0;for(const i of ess[di]){const req=fd[di].scores[i]-REQ_MARGIN;if(x[i]<req)p+=req-x[i];}return p;}

  // スコア（higher=better）
  const methods=[
    {name:"cosine",        f:(x:number[],di:number)=> cos(x,fd[di])},
    {name:"wL2_var",       f:(x:number[],di:number)=> -wdist(x,fd[di])},
    {name:"cosine+gate",   f:(x:number[],di:number)=> cos(x,fd[di]) - GATE*gate(x,di)},
    {name:"wL2_var+gate",  f:(x:number[],di:number)=> -wdist(x,fd[di]) - GATE*gate(x,di)},
  ];

  const recHit=methods.map(()=>new Array(D).fill(0));
  const rejHit=methods.map(()=>new Array(D).fill(0)); // 偽物をtop1から外せた数
  const ans=new Array(questions.length).fill(0);
  const t0=Date.now();
  for(let di=0;di<D;di++){
    const d=fd[di] as any;
    const hasEss=ess[di].size>0;
    for(let m=0;m<M;m++){
      // --- 復元(本物) ---
      for(let j=0;j<questions.length;j++)ans[j]=genAns(questions[j],d.scores[questions[j].axisIndex]);
      const xr=calcAxisScores(ans,questions);
      for(let s=0;s<methods.length;s++){let best=0,bv=-Infinity;for(let k=0;k<D;k++){const val=methods[s].f(xr,k);if(val>bv){bv=val;best=k;}}if(best===di)recHit[s][di]++;}
      // --- 棄却(偽物: 必須軸だけ欠落) ---
      if(hasEss){
        for(let j=0;j<questions.length;j++)ans[j]=genNearMiss(questions[j],d.scores[questions[j].axisIndex],essQ[di]);
        const xn=calcAxisScores(ans,questions);
        for(let s=0;s<methods.length;s++){let best=0,bv=-Infinity;for(let k=0;k<D;k++){const val=methods[s].f(xn,k);if(val>bv){bv=val;best=k;}}if(best!==di)rejHit[s][di]++;}
      }
    }
  }
  const secs=(Date.now()-t0)/1000;
  console.error(`done ${v}: ${secs.toFixed(1)}s`);

  const essIdx=fd.map((_,i)=>i).filter(i=>ess[i].size>0);
  const chemIdx=fd.map((d:any,i:number)=>CHEM.has(d.id)?i:-1).filter(i=>i>=0);
  md+=`\n## ${v}（学科${D}・必須軸あり${essIdx.length}学科・計算${secs.toFixed(0)}秒）\n\n`;
  md+=`| 手法 | 復元 mean | 復元 min | chem4復元 | **偽物棄却率** |\n|---|--:|--:|--:|--:|\n`;
  for(let s=0;s<methods.length;s++){
    const r=recHit[s].map(c=>c/M*100);
    const mean1=r.reduce((a,b)=>a+b,0)/D, min1=Math.min(...r);
    const chem=chemIdx.reduce((a,i)=>a+r[i],0)/chemIdx.length;
    const rej=essIdx.reduce((a,i)=>a+rejHit[s][i]/M*100,0)/essIdx.length;
    md+=`| ${methods[s].name} | ${mean1.toFixed(1)}% | ${min1.toFixed(1)}% | ${chem.toFixed(1)}% | ${rej.toFixed(1)}% |\n`;
  }
  // 数学科の必須軸だけ個別表示
  const mi=fd.findIndex((d:any)=>d.id==="math");
  if(mi>=0){md+=`\n（数学科の必須軸: ${[...ess[mi]].map(i=>["MATH","MEMO","LAB","FIELD","CODE","MAKE","LANG","CARE","BIZ","ART","ABS","TEAM","CERT","GRAD","LIFE","ANIMAL","NARRATIVE","JUSTICE","BODY"][i]).join(",")}）\n`;}
}

const out1=`/Users/hiraiichijou/home/my-company/.company/secretary/notes/${DATE}-必須軸ゲーティング検証.md`;
const out2=`/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-gating-test.md`;
fs.writeFileSync(out1,md);fs.writeFileSync(out2,md);
console.error("REPORT WRITTEN: "+out1);
