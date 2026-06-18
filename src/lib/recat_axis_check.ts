// ⚠️ 2026-06-18 実装後は廃止予定: 新4学部は departments.ts に追加済み。
//   本スクリプトは base(departments) に NEW を「上乗せ」するため、実装後は二重計上になり
//   新4学部が自分の複製と100%混同して復元0%と表示される（正常な副作用）。
//   実装後の正式検証は v2_verify.ts（departments を直接読む）を使うこと。
//   このファイルは「実装前の事前検証」の記録として残置。
//
// 36学部(9×4)で「新規4学部が現22軸で見分けられるか」を検証（2026-06-18）
//
// 問い: 軸を増やさないといけないか？ = 新規学部がその近縁(twin)と現22軸で分離できるか。
//   分離できる→新軸0→新質問0。できない(混同)→分離用の新軸が必要→3問/軸 追加。
// 方法: 各学部の「理想だがブレた受験生」をノイズ付きで多数生成し、v2(36集合)で top1 復元率を測る。
//   復元率が高い=現22軸で見分けられる。低い(twinに奪われる)=新軸が要る。
//
// 実行: <CA>/node_modules/.bin/tsc <CA>/src/lib/recat_axis_check.ts --outDir /tmp/rax \
//   --module commonjs --target es2020 --moduleResolution node --esModuleInterop ; node /tmp/rax/recat_axis_check.js

import { departments, AXIS_COUNT, AXIS_NAMES } from "./departments";

type Fac = { id: string; name: string; scores: number[]; gradExempt?: boolean; isNew?: boolean };
// 2026-06-18 改訂: 暫定類推値 → 6大学帯シラバス実採取に基づく確定値
// （採取根拠＝analysis/2026-06-18-new4-syllabus-axis-study.md）。
// 最大の修正は材料工 PROC 0.65→0.4（化学工との混同主因＝単位操作/移動現象は材料工に無い）。
const NEW: Fac[] = [
  { id: "dentistry", name: "歯学科", gradExempt: true, isNew: true, scores: [0.3, 0.9, 0.7, 0.3, 0.1, 0.6, 0.2, 0.8, 0.2, 0.2, 0.3, 0.5, 1.0, 0.0, 0.85, 0.05, 0.0, 0.05, 0.4, 0.2, 0.55, 0.15] },
  { id: "civil-eng", name: "土木・都市環境工学科", isNew: true, scores: [0.6, 0.3, 0.5, 0.7, 0.3, 0.85, 0.1, 0.2, 0.2, 0.3, 0.4, 0.6, 0.55, 0.45, 0.05, 0.0, 0.1, 0.15, 0.2, 0.3, 0.1, 0.6] },
  { id: "mgmt-eng", name: "経営工学科", isNew: true, scores: [0.8, 0.3, 0.1, 0.15, 0.65, 0.25, 0.15, 0.2, 0.75, 0.1, 0.6, 0.7, 0.35, 0.35, 0.0, 0.0, 0.0, 0.05, 0.0, 0.35, 0.05, 0.6] },
  { id: "materials-eng", name: "材料工学科", isNew: true, scores: [0.7, 0.3, 0.85, 0.0, 0.35, 0.55, 0.1, 0.05, 0.15, 0.1, 0.6, 0.35, 0.1, 0.7, 0.0, 0.0, 0.0, 0.0, 0.05, 0.45, 0.15, 0.4] },
];
// 栄養を落とした36
const fac: Fac[] = [...departments.map((d) => ({ id: d.id, name: d.name, scores: d.scores, gradExempt: d.gradExempt })), ...NEW];
const N = fac.length;

// v2（36集合・mixed=全22軸計測）
const GAMMA = 0.7, G_STR = 2.0, G_THR = 0.45, ESS = 0.8, GRAD = 13, EPS = 1e-9, SIM_K = 0.35, SIM_P = 1.5;
const M = [...Array(AXIS_COUNT).keys()];
const W = new Array(AXIS_COUNT).fill(0);
for (const i of M) { let m = 0; for (const d of fac) m += d.scores[i]; m /= N; let v = 0; for (const d of fac) v += (d.scores[i] - m) ** 2; W[i] = Math.pow(Math.sqrt(v / N) + EPS, GAMMA); }
const essA = fac.map((d) => new Set(M.filter((i) => i !== GRAD && d.scores[i] >= ESS)));
function eff(user: number[], di: number): number {
  const d = fac[di]; let s = 0;
  for (const i of M) { if (i === GRAD && d.gradExempt) continue; const df = user[i] - d.scores[i]; s += W[i] * df * df; }
  let pen = 0; for (const i of essA[di]) if (user[i] < G_THR) pen += G_THR - user[i];
  return Math.sqrt(s) + G_STR * pen;
}
function rankTop1(user: number[]): number { let bi = 0, bs = Infinity; for (let i = 0; i < N; i++) { const e = eff(user, i); if (e < bs) { bs = e; bi = i; } } return bi; }

// seeded PRNG + gaussian
let seed = 12345;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function gauss() { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const clamp = (x: number) => Math.max(0, Math.min(1, x));

function recovery(sigma: number, trials: number) {
  const rec = new Array(N).fill(0);
  const conf: Record<number, Record<number, number>> = {};
  for (let di = 0; di < N; di++) {
    conf[di] = {};
    for (let t = 0; t < trials; t++) {
      const u = fac[di].scores.map((x) => clamp(x + gauss() * sigma));
      const top = rankTop1(u);
      if (top === di) rec[di]++; else conf[di][top] = (conf[di][top] || 0) + 1;
    }
  }
  return { rec: rec.map((r) => r / trials), conf };
}

console.log("=== 36学部(9×4) 復元率: 現22軸で各学部を見分けられるか ===");
for (const sigma of [0.10, 0.15]) {
  const { rec, conf } = recovery(sigma, 4000);
  console.log(`\n--- ノイズσ=${sigma} (理想受験生のブレ。大きいほど厳しい) ---`);
  const rows = fac.map((f, i) => ({ f, i, r: rec[i] })).sort((a, b) => a.r - b.r);
  console.log("  [復元率が低い=見分けにくい 下位12]");
  for (const { f, i, r } of rows.slice(0, 12)) {
    const c = conf[i]; const topConf = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    const cf = topConf ? `（最多混同→${fac[+topConf[0]].name} ${(100 * +topConf[1] / 4000).toFixed(0)}%）` : "";
    console.log(`   ${(r * 100).toFixed(0).padStart(3)}%  ${f.name}${f.isNew ? "【新規】" : ""}  ${cf}`);
  }
  const newAvg = fac.filter((f) => f.isNew).map((f) => rec[fac.indexOf(f)]);
  console.log(`  新規4学部の復元率: ${NEW.map((nf) => `${nf.name.slice(0, 4)}=${(rec[fac.indexOf(fac.find((f) => f.id === nf.id)!)] * 100).toFixed(0)}%`).join(" / ")}`);
}

// 各新規学部 vs 最近傍twin: どの軸で分離しているか（新軸が要るかの判断材料）
console.log("\n\n=== 新規学部 vs 近縁twin: 現22軸のどこで分離しているか ===");
function wdist(a: number[], b: number[]) { let s = 0; for (const i of M) s += W[i] * (a[i] - b[i]) ** 2; return Math.sqrt(s); }
for (const nf of NEW) {
  const twins = fac.filter((f) => f.id !== nf.id).map((f) => ({ f, d: wdist(nf.scores, f.scores) })).sort((a, b) => a.d - b.d).slice(0, 2);
  console.log(`\n${nf.name}（近縁: ${twins.map((t) => `${t.f.name}${(t.d).toFixed(2)}`).join(", ")}）`);
  const tw = twins[0].f;
  const gaps = M.map((i) => ({ ax: AXIS_NAMES[i], g: nf.scores[i] - tw.scores[i], w: W[i] })).filter((x) => Math.abs(x.g) >= 0.1).sort((a, b) => Math.abs(b.g * b.w) - Math.abs(a.g * a.w));
  console.log(`  vs ${tw.name}: 差のある軸 = ${gaps.map((x) => `${x.ax}${x.g > 0 ? "+" : ""}${x.g.toFixed(2)}`).join(" ")}`);
  console.log(`  → 分離は ${gaps.length ? "既存軸(" + gaps.slice(0, 3).map((x) => x.ax).join("/") + ")で表現可" : "既存軸で差が小さい=新軸が要る恐れ"}`);
}
