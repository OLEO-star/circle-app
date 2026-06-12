import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores } from "./scoring";
import { departments } from "./departments";
import * as fs from "fs";

const M = parseInt(process.argv[2] || "8000", 10);
const DATE = "2026-06-09";
const EPS = 1e-9;
const MEASURED: Record<string, number[]> = {
  mixed: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
  sciences: [0,1,2,3,4,5,7,10,11,12,13,14,15,18],
};
const CHEM = new Set(["chemistry","applied-chem","life-chem","chem-eng"]);

function clamp(v: number){return v<1?1:v>5?5:v;}
function genAnswer(q: any, target: number){
  const ideal = q.reverse ? (1+4*(1-target)) : (1+4*target);
  return clamp(Math.round(ideal + (((Math.random()*3)|0)-1)));
}
// ベクトル演算（軸リスト上）
const dot=(a:number[],b:number[],ax:number[])=>{let s=0;for(const i of ax)s+=a[i]*b[i];return s;};
const norm=(a:number[],ax:number[])=>{let s=0;for(const i of ax)s+=a[i]*a[i];return Math.sqrt(s);};
const meanOf=(a:number[],ax:number[])=>{let s=0;for(const i of ax)s+=a[i];return s/ax.length;};
function ranks(a:number[],ax:number[]):number[]{ // 軸上の順位（同値は平均順位）
  const idx=ax.map(i=>({i,v:a[i]})).sort((p,q)=>p.v-q.v);
  const r:number[]=new Array(a.length).fill(0);
  let k=0;while(k<idx.length){let j=k;while(j+1<idx.length&&idx[j+1].v===idx[k].v)j++;const rr=(k+j)/2+1;for(let t=k;t<=j;t++)r[idx[t].i]=rr;k=j+1;}
  return r;
}

type Scorer={name:string;higher:boolean;fn:(x:Rep,d:Rep,ax:number[],ctx:Ctx)=>number;};
type Rep={raw:number[];cen:number[];z:number[];vs:number[];rk:number[];nRaw:number;nCen:number;nZ:number;nVs:number;};
type Ctx={mean:number[];std:number[];};

function makeRep(v:number[],ax:number[],ctx:Ctx):Rep{
  const mu=meanOf(v,ax);
  const cen=v.slice(),z=v.slice(),vs=v.slice();
  for(const i of ax){cen[i]=v[i]-mu;z[i]=(v[i]-ctx.mean[i])/(ctx.std[i]+EPS);vs[i]=v[i]*ctx.std[i];}
  return {raw:v,cen,z,vs,rk:ranks(v,ax),nRaw:norm(v,ax),nCen:norm(cen,ax),nZ:norm(z,ax),nVs:norm(vs,ax)};
}
const cos=(a:number[],b:number[],na:number,nb:number,ax:number[])=>(na<EPS||nb<EPS)?0:dot(a,b,ax)/(na*nb);
const Ldist=(x:number[],t:number[],ax:number[],p:number)=>{let s=0;for(const i of ax)s+=Math.pow(Math.abs(x[i]-t[i]),p);return Math.pow(s,1/p);};
const wL2=(x:number[],t:number[],ax:number[],w:(i:number,ctx:Ctx)=>number,ctx:Ctx)=>{let s=0;for(const i of ax)s+=w(i,ctx)*(x[i]-t[i])*(x[i]-t[i]);return Math.sqrt(s);};

const scorers:Scorer[]=[
  {name:"cosine",higher:true,fn:(x,d,ax)=>cos(x.raw,d.raw,x.nRaw,d.nRaw,ax)},
  {name:"dot",higher:true,fn:(x,d,ax)=>dot(x.raw,d.raw,ax)},
  {name:"pearson",higher:true,fn:(x,d,ax)=>cos(x.cen,d.cen,x.nCen,d.nCen,ax)},
  {name:"cosine_varscaled",higher:true,fn:(x,d,ax)=>cos(x.vs,d.vs,x.nVs,d.nVs,ax)},
  {name:"cosine_zscored",higher:true,fn:(x,d,ax)=>cos(x.z,d.z,x.nZ,d.nZ,ax)},
  {name:"spearman",higher:true,fn:(x,d,ax)=>{const xr=x.rk,dr=d.rk;const mx=meanOf(xr,ax),md=meanOf(dr,ax);let s=0,a=0,b=0;for(const i of ax){const u=xr[i]-mx,w=dr[i]-md;s+=u*w;a+=u*u;b+=w*w;}return (a<EPS||b<EPS)?0:s/Math.sqrt(a*b);}},
  {name:"neg_L2",higher:true,fn:(x,d,ax)=>-Ldist(x.raw,d.raw,ax,2)},
  {name:"neg_L1",higher:true,fn:(x,d,ax)=>-Ldist(x.raw,d.raw,ax,1)},
  {name:"neg_Linf",higher:true,fn:(x,d,ax)=>{let m=0;for(const i of ax)m=Math.max(m,Math.abs(x.raw[i]-d.raw[i]));return -m;}},
  {name:"mink_p0.5",higher:true,fn:(x,d,ax)=>-Ldist(x.raw,d.raw,ax,0.5)},
  {name:"mink_p1.5",higher:true,fn:(x,d,ax)=>-Ldist(x.raw,d.raw,ax,1.5)},
  {name:"mink_p3",higher:true,fn:(x,d,ax)=>-Ldist(x.raw,d.raw,ax,3)},
  {name:"mink_p4",higher:true,fn:(x,d,ax)=>-Ldist(x.raw,d.raw,ax,4)},
  {name:"wL2_distinct",higher:true,fn:(x,d,ax,ctx)=>-wL2(x.raw,d.raw,ax,(i)=>Math.abs(d.raw[i]-0.5)+0.05,ctx)},
  {name:"wL2_var_g0.5",higher:true,fn:(x,d,ax,ctx)=>-wL2(x.raw,d.raw,ax,(i,c)=>Math.pow(c.std[i]+EPS,0.5),ctx)},
  {name:"wL2_var_g1",higher:true,fn:(x,d,ax,ctx)=>-wL2(x.raw,d.raw,ax,(i,c)=>c.std[i]+EPS,ctx)},
  {name:"wL2_var_g2",higher:true,fn:(x,d,ax,ctx)=>-wL2(x.raw,d.raw,ax,(i,c)=>Math.pow(c.std[i]+EPS,2),ctx)},
  {name:"wL2_invvar",higher:true,fn:(x,d,ax,ctx)=>-wL2(x.raw,d.raw,ax,(i,c)=>1/(c.std[i]*c.std[i]+0.02),ctx)},
  {name:"canberra",higher:true,fn:(x,d,ax)=>{let s=0;for(const i of ax)s+=Math.abs(x.raw[i]-d.raw[i])/(Math.abs(x.raw[i])+Math.abs(d.raw[i])+EPS);return -s;}},
  {name:"braycurtis",higher:true,fn:(x,d,ax)=>{let n=0,den=0;for(const i of ax){n+=Math.abs(x.raw[i]-d.raw[i]);den+=Math.abs(x.raw[i]+d.raw[i]);}return -n/(den+EPS);}},
];

let md=`# 判定法 自律サーベイ：${scorers.length}手法を復元率で比較（${M.toLocaleString()}人/学科）\n\n**生成日**: ${DATE}\n**指標**: 各学科の理想受験生を合成し、その学科をtop1に出せた割合。mean=全学科平均, min=最弱学科, chem=化学系4学科平均。\n\n`;

for(const v of ["mixed","sciences"] as Version[]){
  const questions=getQuestionsForVersion(v);
  const ax=MEASURED[v];
  const fd=departments.filter((d:any)=>!d.versions||d.versions.includes(v));
  const D=fd.length;
  // 軸統計（学科ターゲット値の分散）
  const mean=new Array(19).fill(0),std=new Array(19).fill(0);
  for(const i of ax){let m=0;for(const d of fd)m+=d.scores[i];m/=D;let s=0;for(const d of fd)s+=(d.scores[i]-m)**2;mean[i]=m;std[i]=Math.sqrt(s/D);}
  const ctx:Ctx={mean,std};
  const dReps=fd.map((d:any)=>makeRep(d.scores.slice(),ax,ctx));

  // 集計: method × dept のtop1ヒット
  const hit=scorers.map(()=>new Array(D).fill(0));
  const ans=new Array(questions.length).fill(0);
  const t0=Date.now();
  for(let di=0;di<D;di++){
    const d=fd[di] as any;
    for(let m=0;m<M;m++){
      for(let j=0;j<questions.length;j++)ans[j]=genAnswer(questions[j],d.scores[questions[j].axisIndex]);
      const x=calcAxisScores(ans,questions);
      const xr=makeRep(x,ax,ctx);
      for(let s=0;s<scorers.length;s++){
        let best=0,bv=-Infinity;
        for(let k=0;k<D;k++){const val=scorers[s].fn(xr,dReps[k],ax,ctx);if(val>bv){bv=val;best=k;}}
        if(best===di)hit[s][di]++;
      }
    }
  }
  const secs=(Date.now()-t0)/1000;
  console.error(`done ${v}: ${secs.toFixed(1)}s`);

  const chemIdx=fd.map((d:any,i:number)=>CHEM.has(d.id)?i:-1).filter(i=>i>=0);
  const rows=scorers.map((sc,s)=>{
    const r=hit[s].map(c=>c/M*100);
    const mean1=r.reduce((a,b)=>a+b,0)/D;
    const min1=Math.min(...r);
    const chem=chemIdx.length?chemIdx.reduce((a,i)=>a+r[i],0)/chemIdx.length:NaN;
    return {name:sc.name,mean1,min1,chem};
  }).sort((a,b)=>b.mean1-a.mean1);

  md+=`\n## ${v}（学科${D}・計算${secs.toFixed(0)}秒）\n\n| 手法 | mean top1 | min top1 | chem4平均 |\n|---|--:|--:|--:|\n`;
  for(const r of rows)md+=`| ${r.name} | ${r.mean1.toFixed(1)}% | ${r.min1.toFixed(1)}% | ${isNaN(r.chem)?"-":r.chem.toFixed(1)+"%"} |\n`;
}

const out1=`/Users/hiraiichijou/home/my-company/.company/secretary/notes/${DATE}-判定法サーベイ.md`;
const out2=`/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-method-search.md`;
fs.writeFileSync(out1,md);fs.writeFileSync(out2,md);
console.error("REPORT WRITTEN: "+out1);
