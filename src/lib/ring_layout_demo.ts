// 32学部リング 並び＆レイアウト デモ（2026-06-17）
//
// 決定事項（かずき 2026-06-17）:
//  - 順序は「22軸ベクトル」から決める（学部の似ている順）
//  - グラデーション（8カテゴリ色の流れ）はそのまま維持
//  - 案A（学部均等 11.25°）と 案B（カテゴリ均等45°＋細分化）を両方見る
//  - 本数は 96(=32×3) と 128(=32×4) を両方見る
//
// 設計の核心:
//  各学部は「自分のカテゴリ色」を持つ。学部をカテゴリ順にグループ化したまま、
//  カテゴリ内の順序だけを22軸の似ている順（アンカー付きseriation）で決める。
//  → 同カテゴリ隣接学部は同色なのでカテゴリ内は色が平坦、境界だけ補間
//  → 現行8色グラデーションと完全に同じ見た目を保ったまま、山谷だけ32に増える。
//
// 出力: /tmp/ringdemo/*.svg を生成。並びも標準出力に出す。
//
// 実行:
//   npx tsc src/lib/ring_layout_demo.ts --outDir /tmp/rld --module commonjs \
//     --target es2020 --moduleResolution node --esModuleInterop
//   node /tmp/rld/ring_layout_demo.js

import { rankDepartments, calcCategoryStrengths } from "./scoring";
import {
  departments,
  AXIS_COUNT,
  CATEGORY_NAMES,
  CATEGORY_COLORS,
  type Department,
} from "./departments";
import * as fs from "fs";

const OUT = "/tmp/ringdemo";
fs.mkdirSync(OUT, { recursive: true });

// ===== Persona A（オーナー型）を表示用フィットネスに使う =====
const PERSONA_A = [0.55, 0.40, 0.90, 0.10, 0.35, 0.45, 0.15, 0.10, 0.20, 0.05, 0.45, 0.35, 0.20, 0.65, 0.05, 0.05, 0.05, 0.05, 0.10, 0.55, 0.35, 0.70];

// ===== 22軸 分散重み（エンジンと同じ γ=0.7・全32学部・全22軸）=====
const GAMMA = 0.7, EPS = 1e-9;
function computeWeights(): number[] {
  const w = new Array(AXIS_COUNT).fill(0);
  for (let i = 0; i < AXIS_COUNT; i++) {
    let mean = 0;
    for (const d of departments) mean += d.scores[i];
    mean /= departments.length;
    let v = 0;
    for (const d of departments) v += (d.scores[i] - mean) ** 2;
    w[i] = Math.pow(Math.sqrt(v / departments.length) + EPS, GAMMA);
  }
  return w;
}
const W = computeWeights();
function wdist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < AXIS_COUNT; i++) s += W[i] * (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
function centroid(ds: Department[]): number[] {
  const c = new Array(AXIS_COUNT).fill(0);
  for (const d of ds) for (let i = 0; i < AXIS_COUNT; i++) c[i] += d.scores[i];
  return c.map((x) => x / ds.length);
}

// ===== カテゴリ内 アンカー付き seriation =====
// カテゴリ順は現行のまま(0..7)。各カテゴリ内の学部順を、
//   cost = dist(前カテゴリ重心, 先頭) + Σ隣接 + dist(末尾, 次カテゴリ重心)
// を最小化する並びに（全順列・最大7!＝5040で総当たり）。
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  arr.forEach((v, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([v, ...p]);
  });
  return out;
}

const byCat: Department[][] = CATEGORY_NAMES.map((_, c) =>
  departments.filter((d) => d.categoryIndex === c)
);
const centroids = byCat.map(centroid);

const ordered: Department[] = [];
const orderLog: string[] = [];
for (let c = 0; c < 8; c++) {
  const prevC = centroids[(c - 1 + 8) % 8];
  const nextC = centroids[(c + 1) % 8];
  const fac = byCat[c];
  let best: Department[] = fac, bestCost = Infinity;
  for (const p of permutations(fac)) {
    let cost = wdist(prevC, p[0].scores) + wdist(p[p.length - 1].scores, nextC);
    for (let k = 0; k < p.length - 1; k++) cost += wdist(p[k].scores, p[k + 1].scores);
    if (cost < bestCost) { bestCost = cost; best = p; }
  }
  ordered.push(...best);
  orderLog.push(`  [${c}] ${CATEGORY_NAMES[c]}: ${best.map((d) => d.name).join(" → ")}`);
}

// ===== フィットネス（Persona A）=====
const results = rankDepartments(PERSONA_A, "mixed");
const scoreById = new Map(results.map((r) => [r.department.id, r.score]));

// ===== 色補間（Ring.tsx mixed = HSL 移植）=====
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
function hslStr(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
}
function lerpHsl([h1, s1, l1]: number[], [h2, s2, l2]: number[], t: number): string {
  let dh = h2 - h1;
  if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  if (Math.abs(dh) >= 150) {
    const midShort = (((h1 + dh / 2) % 360) + 360) % 360;
    if (midShort > 90 && midShort < 270) dh = dh > 0 ? dh - 360 : dh + 360;
  }
  const h = (((h1 + dh * t) % 360) + 360) % 360;
  const hueDist = Math.min(1, Math.abs(dh) / 180);
  const peakDesat = 0.6 * hueDist, peakLight = 0.22 * hueDist, u = 4 * t * (1 - t);
  const s = Math.max(0, (s1 + (s2 - s1) * t) * (1 - peakDesat * u));
  const l = Math.min(1, (l1 + (l2 - l1) * t) + peakLight * u);
  return hslStr(h, s, l);
}

// ===== 制御点モデル =====
type CP = { centerDeg: number; valueNorm: number; hsl: number[] };

function normalize(vals: number[]): number[] {
  const mn = Math.min(...vals), mx = Math.max(...vals), range = mx - mn || 1;
  return vals.map((v) => 0.05 + ((v - mn) / range) * 0.95);
}

// 案A: 学部均等（32×11.25°）
function controlPointsFacultyEqual(): CP[] {
  const seg = 360 / 32;
  const raw = ordered.map((d) => scoreById.get(d.id)! / 100);
  const norm = normalize(raw);
  return ordered.map((d, j) => ({
    centerDeg: (j + 0.5) * seg,
    valueNorm: norm[j],
    hsl: hexToHsl(CATEGORY_COLORS[d.categoryIndex]),
  }));
}
// 案B: カテゴリ均等（8×45°）＋カテゴリ内で細分化
function controlPointsCategoryEqual(): CP[] {
  const raw = ordered.map((d) => scoreById.get(d.id)! / 100);
  const norm = normalize(raw);
  const cps: CP[] = [];
  let idx = 0;
  for (let c = 0; c < 8; c++) {
    const fac = byCat[c];
    const sub = 45 / fac.length;
    for (let k = 0; k < fac.length; k++) {
      // ordered 内での該当 index を引く（ordered はカテゴリ順なので連続）
      const d = fac.find((f) => ordered[idx]?.id === f.id) ?? ordered[idx];
      cps.push({
        centerDeg: c * 45 + (k + 0.5) * sub,
        valueNorm: norm[idx],
        hsl: hexToHsl(CATEGORY_COLORS[ordered[idx].categoryIndex]),
      });
      idx++;
    }
  }
  return cps;
}
// 現行8カテゴリ（参照）
function controlPoints8Cat(): CP[] {
  const strengths = calcCategoryStrengths(results, "mixed");
  const norm = normalize(strengths);
  return CATEGORY_NAMES.map((_, c) => ({
    centerDeg: (c + 0.5) * 45,
    valueNorm: norm[c],
    hsl: hexToHsl(CATEGORY_COLORS[c]),
  }));
}

// 角度 α（リング度・12時=0・時計回り）→ 近傍2制御点で補間
function sampleAt(cps: CP[], alpha: number): { v: number; color: string } {
  const a = ((alpha % 360) + 360) % 360;
  const centers = cps.map((c) => c.centerDeg);
  // 直前/直後の制御点を探す（円環）
  let loIdx = -1;
  for (let j = 0; j < centers.length; j++) if (centers[j] <= a) loIdx = j;
  let lo: number, hi: number, loC: number, hiC: number;
  if (loIdx === -1) { // a が最初の中心より前 → 末尾↔先頭（seam）
    lo = centers.length - 1; hi = 0; loC = centers[lo] - 360; hiC = centers[0];
  } else if (loIdx === centers.length - 1) { // 末尾より後 → 末尾↔先頭
    lo = centers.length - 1; hi = 0; loC = centers[lo]; hiC = centers[0] + 360;
  } else {
    lo = loIdx; hi = loIdx + 1; loC = centers[lo]; hiC = centers[hi];
  }
  const t = hiC === loC ? 0 : (a - loC) / (hiC - loC);
  const v = cps[lo].valueNorm + (cps[hi].valueNorm - cps[lo].valueNorm) * t;
  const color = lerpHsl(cps[lo].hsl, cps[hi].hsl, t);
  return { v, color };
}

function renderSVG(cps: CP[], strands: number, title: string): string {
  const size = 720;
  const cx = size / 2, cy = size / 2;
  const inner = size * 0.16;
  const maxOuter = size * 0.42;
  const minLen = size * 0.02;
  const lw = 4.2;
  const lines: string[] = [];
  for (let i = 0; i < strands; i++) {
    const alpha = (i / strands) * 360;
    const { v, color } = sampleAt(cps, alpha);
    const len = minLen + v * (maxOuter - inner - minLen);
    const rad = (alpha * Math.PI) / 180; // 0=12時, 時計回り
    const x1 = cx + inner * Math.sin(rad), y1 = cy - inner * Math.cos(rad);
    const x2 = cx + (inner + len) * Math.sin(rad), y2 = cy - (inner + len) * Math.cos(rad);
    lines.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="white"/>
${lines.join("\n")}
<text x="${cx}" y="${size - 18}" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#444">${title}</text>
</svg>`;
}

// ===== 出力 =====
const A = controlPointsFacultyEqual();
const B = controlPointsCategoryEqual();
const ref8 = controlPoints8Cat();

const jobs: [string, CP[], number, string][] = [
  ["A_96",  A, 96,  "案A 学部均等 / 96本"],
  ["A_128", A, 128, "案A 学部均等 / 128本"],
  ["B_96",  B, 96,  "案B カテゴリ均等 / 96本"],
  ["B_128", B, 128, "案B カテゴリ均等 / 128本"],
  ["ref8_120", ref8, 120, "参照: 現行8カテゴリ / 120本"],
];
for (const [name, cps, n, title] of jobs) {
  fs.writeFileSync(`${OUT}/${name}.svg`, renderSVG(cps, n, title));
}

// ===== ログ =====
console.log("===== 22軸ベクトルから決めた 32学部の並び（カテゴリ順は維持・カテゴリ内を似てる順に）=====\n");
console.log(orderLog.join("\n"));
console.log("\n===== リング上の並び（時計回り・12時起点）＋ Persona A 適応度 =====");
ordered.forEach((d, j) => {
  const deg = ((j + 0.5) * (360 / 32)).toFixed(1);
  console.log(`  ${String(j + 1).padStart(2)}. ${d.name.padEnd(8, "　")} [${CATEGORY_NAMES[d.categoryIndex]}] 適応度${scoreById.get(d.id)}  (案A中心${deg}°)`);
});
console.log("\n案B カテゴリ別 1学部あたりの角度:");
CATEGORY_NAMES.forEach((n, c) => console.log(`  ${n}: ${byCat[c].length}学部 → ${(45 / byCat[c].length).toFixed(2)}°/学部`));
console.log(`\nSVG 出力先: ${OUT}/ (${jobs.map((j) => j[0]).join(", ")})`);
