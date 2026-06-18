// 36学部 → 9カテゴリ×4学部 再編 候補生成（2026-06-17）
//
// 新規5学部のうち4つを 32学部に足して 36=9×4 にする。どの4つ(=1つ落とす)が
// 最もクリーンか、各シナリオの balanced k-means(k=9,size4) 凝集で比較。
// 新規学部の22軸は既存近縁学部からの類推（実データ未検証・要レビュー）。
//
// 実行: <CA>/node_modules/.bin/tsc <CA>/src/lib/recat_9x4.ts --outDir /tmp/r9 \
//   --module commonjs --target es2020 --moduleResolution node --esModuleInterop ; node /tmp/r9/recat_9x4.js

import { departments, AXIS_COUNT } from "./departments";

type Fac = { id: string; name: string; scores: number[] };
const base: Fac[] = departments.map((d) => ({ id: d.id, name: d.name, scores: d.scores }));

// 軸: MATH0 MEMO1 LAB2 FIELD3 CODE4 MAKE5 LANG6 CARE7 BIZ8 ART9 ABS10 TEAM11 CERT12 GRAD13 LIFE14 ANIMAL15 NARR16 JUST17 BODY18 PURE19 BIO20 PROC21
// 新規5学部（類推。根拠＝近縁学部）
const NEW: Fac[] = [
  // 歯学: 医学に近いが MAKE/BODY(手技)↑・gradExempt
  { id: "dentistry", name: "歯学科", scores: [0.4, 0.9, 0.7, 0.3, 0.1, 0.4, 0.2, 0.8, 0.1, 0.1, 0.35, 0.5, 1.0, 0.0, 0.9, 0.05, 0.0, 0.05, 0.45, 0.25, 0.6, 0.1] },
  // 栄養: 看護＋農/生命化（CARE・LIFE・BIO・LAB・CERT管理栄養士）
  { id: "nutrition", name: "栄養学科", scores: [0.3, 0.7, 0.6, 0.3, 0.1, 0.15, 0.2, 0.85, 0.15, 0.1, 0.3, 0.55, 0.85, 0.15, 0.85, 0.1, 0.05, 0.05, 0.25, 0.3, 0.7, 0.2] },
  // 土木・都市環境工学: 建築に近いが FIELD・TEAM・PROC↑ ART↓（インフラ・環境・測量）
  { id: "civil-eng", name: "土木・都市環境工学科", scores: [0.65, 0.3, 0.4, 0.6, 0.3, 0.85, 0.1, 0.25, 0.2, 0.3, 0.4, 0.6, 0.4, 0.4, 0.05, 0.0, 0.1, 0.1, 0.15, 0.3, 0.1, 0.5] },
  // 経営工学: 経営＋情報/数理（MATH・CODE・BIZ・TEAM・PROC＝IE/最適化）
  { id: "mgmt-eng", name: "経営工学科", scores: [0.7, 0.3, 0.15, 0.1, 0.6, 0.3, 0.15, 0.2, 0.75, 0.1, 0.5, 0.75, 0.2, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.05, 0.65] },
  // 材料工学: 化学工学×物理×ものづくり（LAB・MAKE・PROC・MATH・PURE）
  { id: "materials-eng", name: "材料工学科", scores: [0.7, 0.3, 0.8, 0.0, 0.3, 0.6, 0.1, 0.1, 0.15, 0.1, 0.5, 0.35, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.45, 0.2, 0.65] },
];

const GAMMA = 0.7, EPS = 1e-9;
function weightsOf(set: Fac[]): number[] {
  const w = new Array(AXIS_COUNT).fill(0);
  for (let i = 0; i < AXIS_COUNT; i++) {
    let m = 0; for (const d of set) m += d.scores[i]; m /= set.length;
    let v = 0; for (const d of set) v += (d.scores[i] - m) ** 2;
    w[i] = Math.pow(Math.sqrt(v / set.length) + EPS, GAMMA);
  }
  return w;
}
function wdistW(a: number[], b: number[], W: number[]): number { let s = 0; for (let i = 0; i < AXIS_COUNT; i++) s += W[i] * (a[i] - b[i]) ** 2; return Math.sqrt(s); }
function centroidOf(set: Fac[], idx: number[]): number[] { const c = new Array(AXIS_COUNT).fill(0); for (const j of idx) for (let i = 0; i < AXIS_COUNT; i++) c[i] += set[j].scores[i]; return c.map((x) => x / idx.length); }

// 新規5学部の最近傍（既存32の中で・固定重み=32セット）
const W32 = weightsOf(base);
console.log("===== 新規5学部の最近傍（既存32学部の中・小=似てる）=====");
for (const nf of NEW) {
  const nn = base.map((d) => ({ name: d.name, dd: wdistW(nf.scores, d.scores, W32) })).sort((a, b) => a.dd - b.dd).slice(0, 5);
  console.log(`  ${nf.name.padEnd(16, "　")} → ${nn.map((n) => `${n.name}(${n.dd.toFixed(2)})`).join(", ")}`);
}

// balanced k-means (k=9, size=4)
function balancedKmeans(set: Fac[], W: number[], k: number, size: number): number[][] {
  const n = set.length;
  // 初期: PC1風に proj して k分位代表… 簡易に LAB+CARE 軸の合成で散らす
  const seed = set.map((d, j) => ({ j, key: d.scores[2] - d.scores[7] + 0.3 * d.scores[0] })).sort((a, b) => a.key - b.key);
  let cents = Array.from({ length: k }, (_, q) => set[seed[Math.min(n - 1, Math.floor((q + 0.5) / k * n))].j].scores.slice());
  let assign: number[] = new Array(n).fill(-1);
  for (let iter = 0; iter < 40; iter++) {
    const cap = new Array(k).fill(size); assign = new Array(n).fill(-1);
    const cand: { j: number; c: number; d: number }[] = [];
    for (let j = 0; j < n; j++) for (let c = 0; c < k; c++) cand.push({ j, c, d: wdistW(set[j].scores, cents[c], W) });
    cand.sort((a, b) => a.d - b.d);
    let placed = 0;
    for (const { j, c } of cand) { if (assign[j] === -1 && cap[c] > 0) { assign[j] = c; cap[c]--; placed++; } if (placed === n) break; }
    const ng: number[][] = Array.from({ length: k }, () => []);
    for (let j = 0; j < n; j++) ng[assign[j]].push(j);
    cents = ng.map((g) => centroidOf(set, g));
  }
  const g: number[][] = Array.from({ length: k }, () => []);
  for (let j = 0; j < n; j++) g[assign[j]].push(j);
  return g;
}
function cohesion(set: Fac[], idx: number[], W: number[]): number { let s = 0, c = 0; for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) { s += wdistW(set[idx[a]].scores, set[idx[b]].scores, W); c++; } return c ? s / c : 0; }

console.log("\n===== どの4つを足すか: 各「1つ落とす」シナリオの 9×4 balanced k-means =====");
const scen: { drop: string; cohesion: number; groups: string[][] }[] = [];
for (let drop = 0; drop < NEW.length; drop++) {
  const added = NEW.filter((_, i) => i !== drop);
  const set = [...base, ...added]; // 36
  const W = weightsOf(set);
  const groups = balancedKmeans(set, W, 9, 4);
  const part = groups.map((g) => g.map((j) => set[j].name));
  const coh = groups.reduce((s, g) => s + cohesion(set, g, W), 0) / groups.length;
  scen.push({ drop: NEW[drop].name, cohesion: coh, groups: part });
}
scen.sort((a, b) => a.cohesion - b.cohesion);
for (const s of scen) {
  console.log(`\n--- 落とす=「${s.drop}」 / 平均グループ内距離=${s.cohesion.toFixed(3)}（小=凝集良）---`);
  s.groups.forEach((g, i) => console.log(`   G${i + 1}: ${g.join(", ")}`));
}
console.log(`\n★最良シナリオ（最も凝集）: 落とす=「${scen[0].drop}」 → 残り4つ(${NEW.filter((n) => n.name !== scen[0].drop).map((n) => n.name).join(",")})を追加`);
