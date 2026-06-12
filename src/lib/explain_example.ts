import { departments } from "./departments";

const AX=["MATH","MEMO","LAB","FIELD","CODE","MAKE","LANG","CARE","BIZ","ART","ABS","TEAM","CERT","GRAD","LIFE","ANIMAL","NARRATIVE","JUSTICE","BODY"];
const ax=[...Array(19).keys()];
const GAMMA=0.7, GATE=2, THR=0.45, ESS=0.8, GRAD=13, EPS=1e-9;
const fd:any=departments.filter((d:any)=>!d.versions||d.versions.includes("mixed"));

// 分散重み（mixed全学科のターゲット値のばらつき）
const std=new Array(19).fill(0);
for(const i of ax){let m=0;for(const d of fd)m+=d.scores[i];m/=fd.length;let s=0;for(const d of fd)s+=(d.scores[i]-m)**2;std[i]=Math.sqrt(s/fd.length);}
const w=(i:number)=>Math.pow(std[i]+EPS,GAMMA);

console.log("=== 分散重み（識別力の高い軸トップ8）===");
[...ax].sort((a,b)=>std[b]-std[a]).slice(0,8).forEach(i=>console.log(`  ${AX[i].padEnd(10)} std=${std[i].toFixed(3)}  weight=${w(i).toFixed(3)}`));
console.log("  …(下位) "+[...ax].sort((a,b)=>std[a]-std[b]).slice(0,4).map(i=>`${AX[i]}:w${w(i).toFixed(2)}`).join(" "));

function vec(obj:Record<string,number>){const v=new Array(19).fill(0.1);for(const k in obj)v[AX.indexOf(k)]=obj[k];return v;}
// 例の受験生
const students:Record<string,number[]>={
  "A 数学好き": vec({MATH:0.95,ABS:0.9,GRAD:0.8,MEMO:0.4,CODE:0.5,LAB:0.2}),
  "B 高得点だがMATH低(数学科の偽物)": vec({MATH:0.2,ABS:0.9,GRAD:0.8,MEMO:0.4,CODE:0.5,LAB:0.2}),
};

function wdist(x:number[],d:any){let s=0;for(const i of ax)s+=w(i)*(x[i]-d.scores[i])**2;return Math.sqrt(s);}
function cos(x:number[],d:any){let dt=0,a=0,b=0;for(const i of ax){dt+=x[i]*d.scores[i];a+=x[i]*x[i];b+=d.scores[i]*d.scores[i];}return dt/Math.sqrt(a*b);}
function gate(x:number[],d:any){const E=ax.filter(i=>d.scores[i]>=ESS&&i!==GRAD);let p=0;const hits:string[]=[];for(const i of E){if(x[i]<THR){p+=THR-x[i];hits.push(AX[i]);}}return{p,hits,E:E.map(i=>AX[i])};}

const targets=["math","psychology","physics","info-sci"];
for(const sname in students){
  const x=students[sname];
  console.log(`\n=== 受験生「${sname}」 ===`);
  console.log(`  MATH=${x[0]} ABS=${x[10]} GRAD=${x[13]} CODE=${x[4]} ...`);
  const rows=targets.map(id=>{
    const d=fd.find((q:any)=>q.id===id);
    const dist=wdist(x,d);const g=gate(x,d);
    const finalScore=-(dist+GATE*g.p);
    return {name:d.name,cos:cos(x,d),dist,ess:g.E.join(","),gateHit:g.hits.join(",")||"-",gatePen:g.p,final:finalScore};
  }).sort((a,b)=>b.final-a.final);
  console.log("  学科        | コサイン | wL2距離 | 必須軸 | ゲート発火 | ゲート罰 | 最終スコア(高い=適合)");
  for(const r of rows)
    console.log(`  ${r.name.padEnd(8)} |  ${r.cos.toFixed(3)} | ${r.dist.toFixed(3)} | ${r.ess.padEnd(8)} | ${r.gateHit.padEnd(6)} | ${(GATE*r.gatePen).toFixed(2).padStart(5)} | ${r.final.toFixed(3)}`);
}
