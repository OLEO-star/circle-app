// 文系版(humanities) 学部カテゴリ再編 分析（2026-06-18）
// mixed の 9×4 再編と同手法。距離は humanities 測定軸のみ。
// 実行:
//   CA=/Users/hiraiichijou/home/my-company/circle-app
//   "$CA/node_modules/.bin/tsc" "$CA/src/lib/recat_hum.ts" --outDir /tmp/hum \
//     --module commonjs --target es2020 --moduleResolution node --esModuleInterop
//   node /tmp/hum/recat_hum.js

import { departments, AXIS_COUNT, AXIS_NAMES } from "./departments";

type Fac = { id: string; name: string; scores: number[]; isNew?: boolean };

// humanities 測定軸（scoring.ts MEASURED_AXES.humanities）
const MEAS = [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18];

// 文系13学部（versions に humanities を含むもの）
const base: Fac[] = departments
  .filter((d) => !d.versions || d.versions.includes("humanities"))
  .map((d) => ({ id: d.id, name: d.name, scores: d.scores }));

// 軸index: MATH0 MEMO1 LAB2 FIELD3 CODE4 MAKE5 LANG6 CARE7 BIZ8 ART9 ABS10 TEAM11 CERT12 GRAD13 LIFE14 ANIMAL15 NARR16 JUST17 BODY18 PURE19 BIO20 PROC21
// 新規文系学部 候補（類推・実データ未検証）。測定15軸を中心に妥当値を入れる（非測定軸は近縁から雑に踏襲）。
const NEW: Record<string, Fac> = {
  // メディア学科: 社会学+表現+情報リテラシ。FIELD/NARR/BIZ/TEAM、LANG中、ART中
  media: { id: "media", name: "メディア学科", isNew: true,
    scores: [0.3, 0.4, 0.0, 0.6, 0.3, 0.0, 0.5, 0.3, 0.5, 0.5, 0.4, 0.5, 0.2, 0.3, 0.0, 0.0, 0.7, 0.3, 0.0, 0.4, 0.05, 0.05] },
  // 社会福祉学科: 教育/看護的ケア+JUSTICE+CERT(社会福祉士)+FIELD。文系のCARE系
  welfare: { id: "welfare", name: "社会福祉学科", isNew: true,
    scores: [0.2, 0.5, 0.0, 0.5, 0.0, 0.0, 0.2, 0.95, 0.1, 0.0, 0.3, 0.6, 0.9, 0.2, 0.2, 0.0, 0.2, 0.6, 0.2, 0.3, 0.1, 0.05] },
  // 観光学科: 経営+国際+FIELD+LANG。実学・地域。BIZ/FIELD/LANG/TEAM
  tourism: { id: "tourism", name: "観光学科", isNew: true,
    scores: [0.3, 0.4, 0.0, 0.7, 0.1, 0.0, 0.6, 0.4, 0.6, 0.2, 0.3, 0.6, 0.3, 0.2, 0.1, 0.0, 0.3, 0.2, 0.1, 0.3, 0.05, 0.1] },
  // 史学科: 文学的・人文・暗記(MEMO)・NARR・ABS。文学/哲学の隣
  history: { id: "history", name: "史学科", isNew: true,
    scores: [0.1, 0.8, 0.0, 0.2, 0.0, 0.0, 0.6, 0.1, 0.0, 0.2, 0.7, 0.1, 0.1, 0.4, 0.0, 0.0, 0.9, 0.1, 0.0, 0.7, 0.05, 0.0] },
  // 芸術・デザイン学科: ART最大・MAKE・表現。文学/外国語の表現側
  art: { id: "art", name: "芸術・デザイン学科", isNew: true,
    scores: [0.1, 0.3, 0.0, 0.2, 0.1, 0.4, 0.3, 0.2, 0.3, 1.0, 0.4, 0.3, 0.1, 0.2, 0.0, 0.0, 0.6, 0.1, 0.1, 0.5, 0.05, 0.05] },
};

const GAMMA = 0.7, EPS = 1e-9;
function weightsOf(set: Fac[]): number[] {
  const w = new Array(AXIS_COUNT).fill(0);
  for (const i of MEAS) {
    let m = 0; for (const d of set) m += d.scores[i]; m /= set.length;
    let v = 0; for (const d of set) v += (d.scores[i] - m) ** 2;
    w[i] = Math.pow(Math.sqrt(v / set.length) + EPS, GAMMA);
  }
  return w;
}
function wdist(a: number[], b: number[], W: number[]): number { let s = 0; for (const i of MEAS) s += W[i] * (a[i] - b[i]) ** 2; return Math.sqrt(s); }
function centroidOf(set: Fac[], idx: number[]): number[] { const c = new Array(AXIS_COUNT).fill(0); for (const j of idx) for (const i of MEAS) c[i] += set[j].scores[i]; return c.map((x) => x / idx.length); }

// PC1 風 seriation: power iteration で測定軸の主成分を求めて射影
function pc1(set: Fac[], W: number[]): number[] {
  const n = set.length;
  const mean = new Array(AXIS_COUNT).fill(0);
  for (const i of MEAS) { for (const d of set) mean[i] += d.scores[i]; mean[i] /= n; }
  // 重み付き中心化データ
  const X = set.map((d) => MEAS.map((i) => Math.sqrt(W[i]) * (d.scores[i] - mean[i])));
  const dim = MEAS.length;
  let v = new Array(dim).fill(0).map(() => Math.random());
  for (let it = 0; it < 200; it++) {
    // y = X^T X v
    const Xv = X.map((row) => row.reduce((s, x, k) => s + x * v[k], 0));
    const y = new Array(dim).fill(0);
    for (let r = 0; r < n; r++) for (let k = 0; k < dim; k++) y[k] += X[r][k] * Xv[r];
    const norm = Math.sqrt(y.reduce((s, x) => s + x * x, 0)) || 1;
    v = y.map((x) => x / norm);
  }
  return set.map((_, r) => X[r].reduce((s, x, k) => s + x * v[k], 0));
}

function balancedKmeans(set: Fac[], W: number[], k: number, size: number): number[][] {
  const n = set.length;
  const proj = pc1(set, W);
  const seed = set.map((_, j) => ({ j, key: proj[j] })).sort((a, b) => a.key - b.key);
  let cents = Array.from({ length: k }, (_, q) => set[seed[Math.min(n - 1, Math.floor((q + 0.5) / k * n))].j].scores.slice());
  let assign: number[] = new Array(n).fill(-1);
  for (let iter = 0; iter < 60; iter++) {
    const cap = new Array(k).fill(size); assign = new Array(n).fill(-1);
    const cand: { j: number; c: number; d: number }[] = [];
    for (let j = 0; j < n; j++) for (let c = 0; c < k; c++) cand.push({ j, c, d: wdist(set[j].scores, cents[c], W) });
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
function cohesion(set: Fac[], idx: number[], W: number[]): number { let s = 0, c = 0; for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) { s += wdist(set[idx[a]].scores, set[idx[b]].scores, W); c++; } return c ? s / c : 0; }
function avgCohesion(set: Fac[], groups: number[][], W: number[]): number { return groups.reduce((s, g) => s + cohesion(set, g, W), 0) / groups.length; }

// 近接表示ユーティリティ
function nn(set: Fac[], W: number[], j: number, topn = 3): string {
  return set.map((d, i) => ({ i, d: wdist(set[j].scores, d.scores, W) })).filter((x) => x.i !== j).sort((a, b) => a.d - b.d).slice(0, topn).map((x) => `${set[x.i].name}(${x.d.toFixed(2)})`).join(", ");
}

console.log("=== 文系13学部 測定軸 ===");
console.log("  測定軸(" + MEAS.length + "): " + MEAS.map((i) => AXIS_NAMES[i]).join(" "));

// 基本: 13学部の相互最近傍
{
  const W = weightsOf(base);
  console.log("\n=== 文系13学部 各最近傍（小=似てる）===");
  for (let j = 0; j < base.length; j++) console.log(`  ${base[j].name.padEnd(10, "　")} → ${nn(base, W, j)}`);
}

function printGroups(label: string, set: Fac[], groups: number[][], W: number[], catnames?: string[]) {
  // 勾配順にカテゴリを並べる: 各グループ重心の PC1 射影
  const proj = pc1(set, W);
  const gmean = groups.map((g) => g.reduce((s, j) => s + proj[j], 0) / g.length);
  const order = groups.map((_, i) => i).sort((a, b) => gmean[a] - gmean[b]);
  console.log(`\n--- ${label} / 平均グループ内距離=${avgCohesion(set, groups, W).toFixed(3)} ---`);
  order.forEach((gi, rank) => {
    const g = groups[gi];
    // カテゴリ内も PC1 順
    const gs = g.slice().sort((a, b) => proj[a] - proj[b]);
    const nm = catnames ? catnames[rank] : `C${rank + 1}`;
    console.log(`   [${rank + 1}] ${nm}: ${gs.map((j) => set[j].name).join(" → ")}`);
  });
}

// ===== 案A: 16 = 4×4。新規3学部を足す。候補5から3つ選ぶ全組合せを比較 =====
console.log("\n\n========== 案A: 16=4×4（新規3学部追加）==========");
const cand = Object.keys(NEW);
const combos: string[][] = [];
for (let a = 0; a < cand.length; a++) for (let b = a + 1; b < cand.length; b++) for (let c = b + 1; c < cand.length; c++) combos.push([cand[a], cand[b], cand[c]]);
const aScen: { adds: string[]; coh: number; groups: number[][]; set: Fac[] }[] = [];
for (const combo of combos) {
  const set = [...base, ...combo.map((k) => NEW[k])]; // 16
  const W = weightsOf(set);
  const groups = balancedKmeans(set, W, 4, 4);
  aScen.push({ adds: combo, coh: avgCohesion(set, groups, W), groups, set });
}
aScen.sort((a, b) => a.coh - b.coh);
console.log("  [追加3学部の組合せ ベスト5（小=凝集良）]");
for (const s of aScen.slice(0, 5)) console.log(`   +${s.adds.map((k) => NEW[k].name).join("/")}  coh=${s.coh.toFixed(3)}`);
const bestA = aScen[0];
printGroups(`案A 最良: +${bestA.adds.map((k) => NEW[k].name).join("/")}`, bestA.set, bestA.groups, weightsOf(bestA.set));

// ===== 案B: 12 = 4×3。13から1学部を落とす全シナリオ比較 =====
console.log("\n\n========== 案B-1: 12=4×3（1学部 drop）==========");
const bScen: { drop: string; coh: number; groups: number[][]; set: Fac[] }[] = [];
for (let d = 0; d < base.length; d++) {
  const set = base.filter((_, i) => i !== d);
  const W = weightsOf(set);
  const groups = balancedKmeans(set, W, 4, 3);
  bScen.push({ drop: base[d].name, coh: avgCohesion(set, groups, W), groups, set });
}
bScen.sort((a, b) => a.coh - b.coh);
console.log("  [どれを落とすか ベスト5]");
for (const s of bScen.slice(0, 5)) console.log(`   落とす=${s.drop}  coh=${s.coh.toFixed(3)}`);
const bestB = bScen[0];
printGroups(`案B-1 最良: 落とす=${bestB.drop}`, bestB.set, bestB.groups, weightsOf(bestB.set));

// ===== 案B-2: 12 = 6×2 =====
console.log("\n\n========== 案B-2: 12=6×2（1学部 drop）==========");
const b2Scen: { drop: string; coh: number; groups: number[][]; set: Fac[] }[] = [];
for (let d = 0; d < base.length; d++) {
  const set = base.filter((_, i) => i !== d);
  const W = weightsOf(set);
  const groups = balancedKmeans(set, W, 6, 2);
  b2Scen.push({ drop: base[d].name, coh: avgCohesion(set, groups, W), groups, set });
}
b2Scen.sort((a, b) => a.coh - b.coh);
console.log("  [どれを落とすか ベスト5]");
for (const s of b2Scen.slice(0, 5)) console.log(`   落とす=${s.drop}  coh=${s.coh.toFixed(3)}`);
const bestB2 = b2Scen[0];
printGroups(`案B-2 最良: 落とす=${bestB2.drop}`, bestB2.set, bestB2.groups, weightsOf(bestB2.set));

// ===== 案C: 全13を残す不均等案。例 14=新規1追加で 7×2、あるいは現13で 自由k =====
console.log("\n\n========== 案C: 14=7×2（新規1追加・全13残す）==========");
const cScen: { add: string; coh: number; groups: number[][]; set: Fac[] }[] = [];
for (const k of cand) {
  const set = [...base, NEW[k]];
  const W = weightsOf(set);
  const groups = balancedKmeans(set, W, 7, 2);
  cScen.push({ add: NEW[k].name, coh: avgCohesion(set, groups, W), groups, set });
}
cScen.sort((a, b) => a.coh - b.coh);
console.log("  [追加1学部 ベスト]");
for (const s of cScen) console.log(`   +${s.add}  coh=${s.coh.toFixed(3)}`);
const bestC = cScen[0];
printGroups(`案C 最良: +${bestC.add} (7×2)`, bestC.set, bestC.groups, weightsOf(bestC.set));

// 14=不均等の自然案: 現13そのまま 4カテゴリ(4/3/3/3) 自由バランス
console.log("\n\n========== 案C2: 現13そのまま 4カテゴリ(4/3/3/3 不均等)==========");
{
  const set = base;
  const W = weightsOf(set);
  // 緩いbalanced: サイズ配列指定版
  const sizes = [4, 3, 3, 3];
  // greedy: 4センターをPC1分位、容量はsizes
  const proj = pc1(set, W);
  const n = set.length, k = 4;
  const seed = set.map((_, j) => ({ j, key: proj[j] })).sort((a, b) => a.key - b.key);
  let cents = Array.from({ length: k }, (_, q) => set[seed[Math.min(n - 1, Math.floor((q + 0.5) / k * n))].j].scores.slice());
  let assign = new Array(n).fill(-1);
  for (let iter = 0; iter < 60; iter++) {
    const cap = sizes.slice(); assign = new Array(n).fill(-1);
    const c2: { j: number; c: number; d: number }[] = [];
    for (let j = 0; j < n; j++) for (let c = 0; c < k; c++) c2.push({ j, c, d: wdist(set[j].scores, cents[c], W) });
    c2.sort((a, b) => a.d - b.d);
    let placed = 0;
    for (const { j, c } of c2) { if (assign[j] === -1 && cap[c] > 0) { assign[j] = c; cap[c]--; placed++; } if (placed === n) break; }
    const ng: number[][] = Array.from({ length: k }, () => []);
    for (let j = 0; j < n; j++) ng[assign[j]].push(j);
    cents = ng.map((g) => centroidOf(set, g));
  }
  const groups: number[][] = Array.from({ length: k }, () => []);
  for (let j = 0; j < n; j++) groups[assign[j]].push(j);
  printGroups("案C2 現13 4カテゴリ(4/3/3/3)", set, groups, W);
}

console.log("\n\n=== cohesion 総比較 ===");
console.log(`  案A 16=4×4  best: ${bestA.coh.toFixed(3)}  (+${bestA.adds.map((k) => NEW[k].name).join("/")})`);
console.log(`  案B-1 12=4×3 best: ${bestB.coh.toFixed(3)}  (drop ${bestB.drop})`);
console.log(`  案B-2 12=6×2 best: ${bestB2.coh.toFixed(3)}  (drop ${bestB2.drop})`);
console.log(`  案C 14=7×2  best: ${bestC.coh.toFixed(3)}  (+${bestC.add})`);
console.log("  ※ k・size が違うと cohesion の絶対値は直接比較不可（カテゴリが小さいほど小さく出る）。");
console.log("  ※ 同一 (k,size) 内での相対比較が妥当。案間は『鉄板グループの崩れ・妥協の質』で判断。");
