// 32学部 → 8カテゴリ×4学部 再編 候補生成（2026-06-17）
//
// 目的: かずきの「1カテゴリ4学部にすれば 案A=案B になる」案の feasibility 確認。
//   22軸ベクトルから、8グループ×ちょうど4学部の候補分割を複数生成し、
//   各候補の内部凝集度・勾配（理系↔文系スペクトル）を出す。学術的妥当性の判断＆命名は後段の多段レビューで。
//
// 出力: 候補3種（①PC1スペクトル等分割 ②current最小組換え ③貪欲バランスkmeans）＋根拠データ。
//
// 実行: npx tsc src/lib/recat_8x4.ts --outDir /tmp/rc --module commonjs \
//   --target es2020 --moduleResolution node --esModuleInterop ; node /tmp/rc/recat_8x4.js

import { departments, AXIS_COUNT, AXIS_NAMES, CATEGORY_NAMES, type Department } from "./departments";

const GAMMA = 0.7, EPS = 1e-9;
const N = departments.length;

// 分散重み（全32・全22軸）
const W = new Array(AXIS_COUNT).fill(0);
for (let i = 0; i < AXIS_COUNT; i++) {
  let m = 0; for (const d of departments) m += d.scores[i]; m /= N;
  let v = 0; for (const d of departments) v += (d.scores[i] - m) ** 2;
  W[i] = Math.pow(Math.sqrt(v / N) + EPS, GAMMA);
}
const wsqrt = W.map(Math.sqrt);
function wdist(a: number[], b: number[]): number {
  let s = 0; for (let i = 0; i < AXIS_COUNT; i++) s += W[i] * (a[i] - b[i]) ** 2; return Math.sqrt(s);
}
function centroid(idx: number[]): number[] {
  const c = new Array(AXIS_COUNT).fill(0);
  for (const j of idx) for (let i = 0; i < AXIS_COUNT; i++) c[i] += departments[j].scores[i];
  return c.map((x) => x / idx.length);
}

// ===== PC1（重み付き共分散の第1主成分・べき乗法）=====
const mean = new Array(AXIS_COUNT).fill(0);
for (const d of departments) for (let i = 0; i < AXIS_COUNT; i++) mean[i] += d.scores[i] / N;
// スケール済みデータ X[j][i] = (x-mean)*sqrt(w)
const X = departments.map((d) => d.scores.map((x, i) => (x - mean[i]) * wsqrt[i]));
// 共分散 C = X^T X (22x22)
const C: number[][] = Array.from({ length: AXIS_COUNT }, () => new Array(AXIS_COUNT).fill(0));
for (let a = 0; a < AXIS_COUNT; a++) for (let b = 0; b < AXIS_COUNT; b++) {
  let s = 0; for (let j = 0; j < N; j++) s += X[j][a] * X[j][b]; C[a][b] = s;
}
let pc = new Array(AXIS_COUNT).fill(1).map((_, i) => Math.sin(i + 1)); // 決定的な非対称初期
for (let it = 0; it < 300; it++) {
  const nv = new Array(AXIS_COUNT).fill(0);
  for (let a = 0; a < AXIS_COUNT; a++) { let s = 0; for (let b = 0; b < AXIS_COUNT; b++) s += C[a][b] * pc[b]; nv[a] = s; }
  const norm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0)) || 1;
  pc = nv.map((x) => x / norm);
}
// 射影（スペクトル位置）
const proj = X.map((row) => row.reduce((s, x, i) => s + x * pc[i], 0));
// 向きをそろえる: 理系(LAB高)側を正に → LAB次元のpc符号で決める
const LAB = 2;
const sign = pc[LAB] >= 0 ? 1 : -1;
const projS = proj.map((p) => p * sign);

const order = [...Array(N).keys()].sort((a, b) => projS[a] - projS[b]);

// PC1の主要寄与軸（解釈用）
const contrib = pc.map((v, i) => ({ axis: AXIS_NAMES[i], w: v * sign })).sort((a, b) => Math.abs(b.w) - Math.abs(a.w));

function names(idx: number[]): string { return idx.map((j) => departments[j].name).join(", "); }
function cohesion(idx: number[]): number { // 平均ペア距離（小=凝集）
  let s = 0, c = 0; for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) { s += wdist(departments[idx[a]].scores, departments[idx[b]].scores); c++; }
  return c ? s / c : 0;
}
function partitionCohesion(groups: number[][]): number {
  return groups.reduce((s, g) => s + cohesion(g), 0) / groups.length;
}

// ===== 候補① PC1スペクトル等分割（順に4ずつ切る）=====
const spectralGroups: number[][] = [];
for (let g = 0; g < 8; g++) spectralGroups.push(order.slice(g * 4, g * 4 + 4));

// ===== 候補② current最小組換え（自然7・生命5 → 余剰4を 数理/経済/言語/スポ教 へ）=====
const curGroups: number[][] = CATEGORY_NAMES.map((_, c) => [...Array(N).keys()].filter((j) => departments[j].categoryIndex === c));
const curCentroids = curGroups.map(centroid);
// 余剰元: cat7(自然,7) 最大3, cat5(生命,5) 最大1。不足先: 0,1,3,4 各+1
const deficit = [0, 1, 3, 4]; // 数理,経済,言語,スポ教
const poolNat = curGroups[7], poolLife = curGroups[5];
// 自然から3, 生命から1 を選び deficit4枠へ割当（移動先重心への距離最小）
function choose<T>(arr: T[], k: number): T[][] { // k個の組合せ
  if (k === 0) return [[]]; if (k > arr.length) return [];
  const [h, ...t] = arr; return [...choose(t, k - 1).map((c) => [h, ...c]), ...choose(t, k)];
}
let bestReshuffle: number[][] | null = null, bestCost = Infinity, bestMoves = "";
for (const fromNat of choose(poolNat, 3)) for (const fromLife of poolLife) {
  const movers = [...fromNat, fromLife];
  // 4 movers → 4 deficit categories の最小割当（全順列）
  const perms = (function p(a: number[]): number[][] { if (a.length <= 1) return [a]; const o: number[][] = []; a.forEach((v, i) => { for (const r of p([...a.slice(0, i), ...a.slice(i + 1)])) o.push([v, ...r]); }); return o; })(movers);
  for (const perm of perms) {
    let cost = 0; for (let k = 0; k < 4; k++) cost += wdist(departments[perm[k]].scores, curCentroids[deficit[k]].map((x) => x)); // movers[k]→deficit[k]
    if (cost < bestCost) {
      bestCost = cost;
      const g: number[][] = curGroups.map((arr) => [...arr]);
      // remove movers from their original cats
      for (const m of movers) { const oc = departments[m].categoryIndex; g[oc] = g[oc].filter((x) => x !== m); }
      for (let k = 0; k < 4; k++) g[deficit[k]].push(perm[k]);
      bestReshuffle = g;
      bestMoves = perm.map((m, k) => `${departments[m].name}→${CATEGORY_NAMES[deficit[k]]}`).join(" / ");
    }
  }
}
const reshuffleGroups = bestReshuffle!;

// ===== 候補③ 貪欲バランス k-means（size=4 厳守）=====
// 初期centroid = スペクトル8分位の代表。Lloyd→各クラスタを最近傍順に4枠埋める貪欲割当。
function balancedKmeans(): number[][] {
  let cents = [0, 1, 2, 3, 4, 5, 6, 7].map((q) => departments[order[Math.min(N - 1, Math.floor((q + 0.5) / 8 * N))]].scores.slice());
  let assign: number[] = new Array(N).fill(-1);
  for (let iter = 0; iter < 30; iter++) {
    // 各点を全centへの距離でソートし、容量4の貪欲割当
    const cap = new Array(8).fill(4);
    assign = new Array(N).fill(-1);
    const cand: { j: number; c: number; d: number }[] = [];
    for (let j = 0; j < N; j++) for (let c = 0; c < 8; c++) cand.push({ j, c, d: wdist(departments[j].scores, cents[c]) });
    cand.sort((a, b) => a.d - b.d);
    let placed = 0;
    for (const { j, c } of cand) { if (assign[j] === -1 && cap[c] > 0) { assign[j] = c; cap[c]--; placed++; } if (placed === N) break; }
    // recompute centroids
    const ng: number[][] = Array.from({ length: 8 }, () => []);
    for (let j = 0; j < N; j++) ng[assign[j]].push(j);
    cents = ng.map((g) => centroid(g));
  }
  const g: number[][] = Array.from({ length: 8 }, () => []);
  for (let j = 0; j < N; j++) g[assign[j]].push(j);
  return g;
}
const kmGroups = balancedKmeans();

// グループ列を勾配順（重心PC1射影）に並べる
function orderGroupsByGradient(groups: number[][]): number[][] {
  const gp = groups.map((g) => { const c = centroid(g); const sc = c.map((x, i) => (x - mean[i]) * wsqrt[i]); return sc.reduce((s, x, i) => s + x * pc[i] * sign, 0); });
  return groups.map((g, i) => ({ g, p: gp[i] })).sort((a, b) => a.p - b.p).map((o) => o.g);
}

function report(title: string, groupsRaw: number[][], extra = "") {
  const groups = orderGroupsByGradient(groupsRaw);
  console.log(`\n========== ${title} ==========${extra ? "  " + extra : ""}`);
  console.log(`  partition cohesion(平均グループ内距離, 小=良): ${partitionCohesion(groups).toFixed(3)}`);
  groups.forEach((g, i) => console.log(`  G${i + 1} [凝集${cohesion(g).toFixed(2)}]: ${names(g)}`));
  // 勾配の滑らかさ = 隣接グループ重心距離
  let smooth = 0; for (let i = 0; i < 8; i++) smooth += wdist(centroid(groups[i]), centroid(groups[(i + 1) % 8]));
  console.log(`  勾配滑らかさ(隣接重心距離合計, 小=滑らか): ${smooth.toFixed(3)}`);
}

console.log("================ 32学部 → 8×4 再編 候補 ================");
console.log("\nPC1（学術スペクトル）主要寄与軸 top10（+ = 理系/もの寄り, - = 文系/人寄り）:");
console.log("  " + contrib.slice(0, 10).map((c) => `${c.axis}${c.w >= 0 ? "+" : ""}${c.w.toFixed(2)}`).join("  "));
console.log("\nPC1順 全32学部（文系↔理系スペクトル）:");
order.forEach((j, r) => console.log(`  ${String(r + 1).padStart(2)}. ${departments[j].name.padEnd(8, "　")} proj=${projS[j].toFixed(3)} [${CATEGORY_NAMES[departments[j].categoryIndex]}]`));

report("候補① PC1スペクトル等分割（4ずつ切る・勾配は構造的に最滑）", spectralGroups);
report("候補② current最小組換え（馴染み重視）", reshuffleGroups, "移動: " + bestMoves);
report("候補③ 貪欲バランスk-means（凝集重視）", kmGroups);

// 各学部の最近傍3（グループ妥当性チェック用）
console.log("\n各学部の最近傍3学部（22軸・グルーピング検証用）:");
for (let j = 0; j < N; j++) {
  const nn = [...Array(N).keys()].filter((k) => k !== j).map((k) => ({ k, d: wdist(departments[j].scores, departments[k].scores) })).sort((a, b) => a.d - b.d).slice(0, 3);
  console.log(`  ${departments[j].name.padEnd(8, "　")} → ${nn.map((n) => `${departments[n.k].name}(${n.d.toFixed(2)})`).join(", ")}`);
}
