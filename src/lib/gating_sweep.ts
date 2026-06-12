import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores } from "./scoring";
import { departments } from "./departments";
import * as fs from "fs";

const M = parseInt(process.argv[2] || "8000", 10);
const DATE = "2026-06-09";
const ESS = 0.8, GAMMA = 0.7, EPS = 1e-9;
const GRAD = 13;
const MEASURED: Record<string, number[]> = {
  mixed: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
  sciences: [0,1,2,3,4,5,7,10,11,12,13,14,15,18],
};
function clamp(v:number){return v<1?1:v>5?5:v;}
function genAns(q:any,t:number){const ideal=q.reverse?(1+4*(1-t)):(1+4*t);return clamp(Math.round(ideal+(((Math.random()*3)|0)-1)));}
function genNearMiss(q:any,t:number,essAx:Set<number>){if(essAx.has(q.axisIndex))return q.reverse?5:1;return genAns(q,t);}

// ゲート設定の格子
type Cfg={name:string;thr:number;G:number;exclGrad:boolean};
const baseCfgs:Cfg[]=[];
for(const thr of [0.35,0.45,0.55]) for(const G of [1.5,3]) for(const exclGrad of [false,true])
  baseCfgs.push({name:`gate thr${thr} G${G}${exclGrad?" -GRAD":""}`,thr,G,exclGrad});

let md=`# ゲート微調整スイープ：復元を落とさず棄却を上げる点を探す（${M.toLocaleString()}人/学科）\n\n`;
md+=`**生成日**: ${DATE}\n**ベース**: wL2_var(γ${GAMMA})。ゲート=必須軸(target≥${ESS})で x<thr のとき G×(thr-x) を減点。-GRADはGRAD軸を必須から除外。\n`;
md+=`**狙い**: 復元 mean が無ゲール(基準)とほぼ同等のまま、棄却率が最大の設定。\n\n`;

for(const v of ["mixed","sciences"] as Version[]){
  const questions=getQuestionsForVersion(v);
  const ax=MEASURED[v];
  const fd=departments.filter((d:any)=>!d.versions||d.versions.includes(v));
  const D=fd.length;
  const std=new Array(19).fill(0);
  for(const i of ax){let m=0;for(const d of fd)m+=d.scores[i];m/=D;let s=0;for(const d of fd)s+=(d.scores[i]-m)**2;std[i]=Math.sqrt(s/D);}
  const w=(i:number)=>Math.pow(std[i]+EPS,GAMMA);
  const essAll=fd.map((d:any)=>new Set(ax.filter(i=>d.scores[i]>=ESS)));
  const essNoGrad=fd.map((d:any)=>new Set(ax.filter(i=>d.scores[i]>=ESS&&i!==GRAD)));
  function wdist(x:number[],d:any){let s=0;for(const i of ax)s+=w(i)*(x[i]-d.scores[i])**2;return Math.sqrt(s);}
  function gatePen(x:number[],di:number,cfg:Cfg){const E=cfg.exclGrad?essNoGrad[di]:essAll[di];let p=0;for(const i of E){if(x[i]<cfg.thr)p+=cfg.thr-x[i];}return p;}

  // メソッド: 基準(無ゲート) + 各ゲート設定
  const methods=[{name:"wL2_var (no gate)",thr:0,G:0,exclGrad:false} as Cfg,...baseCfgs];
  const score=(x:number[],di:number,c:Cfg)=> -wdist(x,fd[di]) - (c.G>0?c.G*gatePen(x,di,c):0);

  const rec=methods.map(()=>new Array(D).fill(0));
  const rej=methods.map(()=>new Array(D).fill(0));
  const ans=new Array(questions.length).fill(0);
  const t0=Date.now();
  for(let di=0;di<D;di++){
    const d=fd[di] as any;
    const hasEss=essAll[di].size>0;
    for(let m=0;m<M;m++){
      for(let j=0;j<questions.length;j++)ans[j]=genAns(questions[j],d.scores[questions[j].axisIndex]);
      const xr=calcAxisScores(ans,questions);
      for(let s=0;s<methods.length;s++){let best=0,bv=-Infinity;for(let k=0;k<D;k++){const val=score(xr,k,methods[s]);if(val>bv){bv=val;best=k;}}if(best===di)rec[s][di]++;}
      if(hasEss){
        for(let j=0;j<questions.length;j++)ans[j]=genNearMiss(questions[j],d.scores[questions[j].axisIndex],essAll[di]);
        const xn=calcAxisScores(ans,questions);
        for(let s=0;s<methods.length;s++){let best=0,bv=-Infinity;for(let k=0;k<D;k++){const val=score(xn,k,methods[s]);if(val>bv){bv=val;best=k;}}if(best!==di)rej[s][di]++;}
      }
    }
  }
  const secs=(Date.now()-t0)/1000;
  console.error(`done ${v}: ${secs.toFixed(1)}s`);
  const essIdx=fd.map((_,i)=>i).filter(i=>essAll[i].size>0);
  md+=`\n## ${v}（学科${D}・計算${secs.toFixed(0)}秒）\n\n| 設定 | 復元 mean | 復元 min | 棄却率 |\n|---|--:|--:|--:|\n`;
  for(let s=0;s<methods.length;s++){
    const r=rec[s].map(c=>c/M*100);
    const mean1=r.reduce((a,b)=>a+b,0)/D,min1=Math.min(...r);
    const rj=essIdx.reduce((a,i)=>a+rej[s][i]/M*100,0)/essIdx.length;
    md+=`| ${methods[s].name} | ${mean1.toFixed(1)}% | ${min1.toFixed(1)}% | ${rj.toFixed(1)}% |\n`;
  }
}
const out1=`/Users/hiraiichijou/home/my-company/.company/secretary/notes/${DATE}-ゲート微調整スイープ.md`;
const out2=`/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-gating-sweep.md`;
fs.writeFileSync(out1,md);fs.writeFileSync(out2,md);
console.error("REPORT WRITTEN: "+out1);
