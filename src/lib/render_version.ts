// 版別リングレンダラ（render_grouping.ts をベースに、版ごとの測定軸サブセットで適応度を計算）2026-06-18
//
// 手本: render_grouping.ts（v2判定式＋HSL色補間＋コサイン補間で山谷を丸める）。
// 改造点:
//  1. 測定軸を版ごとに限定（MEASURED 配列を距離計算・重みstd・ゲートessential判定に使う）
//  2. grouping JSON / persona / prefix / 測定軸キー / カテゴリ表記を argv で受け取り 1枚だけ描く
//  3. 山谷はコサイン補間（丸み）。学部スコアは departments.ts の確定値を使用。
//
// 実行:
//  <CA>/node_modules/.bin/tsc <CA>/src/lib/render_version.ts --outDir /tmp/rv --module commonjs \
//    --target es2020 --moduleResolution node --esModuleInterop
//  node /tmp/rv/render_version.js <groupingJson> <prefix> <sci|hum> <persona...>
//   例: node /tmp/rv/render_version.js /tmp/grouping_sci.json sci sci 0.55 0.40 ...(22個)

import { departments, AXIS_COUNT } from "./departments";
import * as fs from "fs";

const OUT = "/tmp/ringdemo";
fs.mkdirSync(OUT, { recursive: true });

// ===== argv =====
const GROUPING_PATH = process.argv[2];
const PREFIX = process.argv[3] || "ver";
const AXISKEY = process.argv[4] || "sci"; // sci | hum
const INTERP = (process.argv[5] === "hsl" || process.argv[5] === "rgb") ? process.argv[5] : "rgb"; // 色補間方式
const PERSONA = process.argv.slice((process.argv[5] === "hsl" || process.argv[5] === "rgb") ? 6 : 5).map(Number);
if (PERSONA.length !== AXIS_COUNT) throw new Error(`persona length ${PERSONA.length} !== ${AXIS_COUNT}`);

// 版ごとの測定軸（scoring.ts の MEASURED_AXES と一致）
const MEASURED_BY_VER: Record<string, number[]> = {
  sci: [0, 1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21],
  hum: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18],
  mixed: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
};
const MEASURED = MEASURED_BY_VER[AXISKEY];
if (!MEASURED) throw new Error(`unknown axis key: ${AXISKEY}`);

type Fac = { id: string; name: string; scores: number[]; gradExempt?: boolean };
const allFac: Fac[] = departments.map((d) => ({ id: d.id, name: d.name, scores: d.scores, gradExempt: d.gradExempt }));
const byName = new Map(allFac.map((f) => [f.name, f]));

type Group = { name: string; members: string[]; color: string };
const cfg: { strands?: number; lw?: number; groups: Group[] } = JSON.parse(fs.readFileSync(GROUPING_PATH, "utf8"));

// active集合 = grouping に出てくる学部（スロット順）
const ordered: { fac: Fac; color: string }[] = [];
for (const g of cfg.groups) for (const m of g.members) {
  const f = byName.get(m); if (!f) throw new Error(`unknown: ${m}`); ordered.push({ fac: f, color: g.color });
}
const active = ordered.map((o) => o.fac);
const NFAC = active.length;
const SEG = 360 / NFAC;
const STRANDS = cfg.strands || NFAC * 4;

// ===== v2判定式を active集合×版別測定軸で再計算 =====
const GAMMA = 0.7, GATE_STRENGTH = 2.0, GATE_THRESHOLD = 0.45, ESSENTIAL = 0.8, GRAD_AXIS = 13, EPS = 1e-9, SIM_K = 0.35, SIM_P = 1.5;
const measured = MEASURED;
const W = new Array(AXIS_COUNT).fill(0);
for (const i of measured) {
  let m = 0; for (const d of active) m += d.scores[i]; m /= active.length;
  let v = 0; for (const d of active) v += (d.scores[i] - m) ** 2;
  W[i] = Math.pow(Math.sqrt(v / active.length) + EPS, GAMMA);
}
const essential = active.map((d) => new Set(measured.filter((i) => i !== GRAD_AXIS && d.scores[i] >= ESSENTIAL)));
function fitness(user: number[]): number[] {
  return active.map((d, di) => {
    let sum = 0;
    for (const i of measured) { if (i === GRAD_AXIS && d.gradExempt) continue; const diff = user[i] - d.scores[i]; sum += W[i] * diff * diff; }
    const dist = Math.sqrt(sum);
    let pen = 0; for (const i of essential[di]) if (user[i] < GATE_THRESHOLD) pen += GATE_THRESHOLD - user[i];
    const eff = dist + GATE_STRENGTH * pen;
    return Math.round(Math.exp(-SIM_K * Math.pow(eff, SIM_P)) * 100);
  });
}

// 色補間（RGB線形）— ライブの理系リングと同じ。hex2色をRGB空間で直線補間して rgb(r,g,b) を返す。
function hexToRgb(hex: string): number[] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function lerpRgb(c1: number[], c2: number[], t: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
// 色補間（HSL）— ライブの文系リングと同じ（白浮き・彩度U字あり）。render_grouping.ts から復元。
function hexToHsl(hex: string): number[] {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0; if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6; else if (max === g) h = ((b - r) / d + 2) / 6; else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
function lerpHsl(c1: number[], c2: number[], t: number): string {
  const [h1, s1, l1] = c1, [h2, s2, l2] = c2;
  let dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  if (Math.abs(dh) >= 150) { const m = (((h1 + dh / 2) % 360) + 360) % 360; if (m > 90 && m < 270) dh = dh > 0 ? dh - 360 : dh + 360; }
  const h = (((h1 + dh * t) % 360) + 360) % 360, hd = Math.min(1, Math.abs(dh) / 180), u = 4 * t * (1 - t);
  const s = Math.max(0, (s1 + (s2 - s1) * t) * (1 - 0.6 * hd * u)), l = Math.min(1, (l1 + (l2 - l1) * t) + 0.22 * hd * u);
  return `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
}
const rgbs = ordered.map((o) => hexToRgb(o.color));
const hsls = ordered.map((o) => hexToHsl(o.color));
function normalize(v: number[]): number[] { const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1; return v.map((x) => 0.05 + ((x - mn) / r) * 0.95); }

function sampleAt(valNorm: number[], alpha: number): { v: number; color: string } {
  const a = ((alpha % 360) + 360) % 360, pos = a / SEG;
  const j0 = Math.floor(pos) % NFAC, frac = pos - Math.floor(pos);
  let lo: number, hi: number, t: number;
  if (frac < 0.5) { lo = (j0 - 1 + NFAC) % NFAC; hi = j0; t = frac + 0.5; } else { lo = j0; hi = (j0 + 1) % NFAC; t = frac - 0.5; }
  // 直線補間: 制御点(山・谷の頂点)で角ができ先端が尖る（mixed の初期＝尖り）。
  const tt = t;
  const color = INTERP === "hsl" ? lerpHsl(hsls[lo], hsls[hi], tt) : lerpRgb(rgbs[lo], rgbs[hi], tt);
  return { v: valNorm[lo] + (valNorm[hi] - valNorm[lo]) * tt, color };
}

function render(persona: number[]): string {
  const sc = fitness(persona);
  const valNorm = normalize(ordered.map((o) => sc[active.indexOf(o.fac)]));
  const size = 820, cx = size / 2, cy = size / 2;
  const inner = size * 0.16, maxOuter = size * 0.355, minLen = size * 0.02, lw = cfg.lw ?? 5.4;
  const lines: string[] = [];
  for (let i = 0; i < STRANDS; i++) {
    const alpha = (i / STRANDS) * 360, { v, color } = sampleAt(valNorm, alpha);
    const len = minLen + v * (maxOuter - inner - minLen), rad = (alpha * Math.PI) / 180;
    lines.push(`<line x1="${(cx + inner * Math.sin(rad)).toFixed(2)}" y1="${(cy - inner * Math.cos(rad)).toFixed(2)}" x2="${(cx + (inner + len) * Math.sin(rad)).toFixed(2)}" y2="${(cy - (inner + len) * Math.cos(rad)).toFixed(2)}" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/>`);
  }
  const labels: string[] = [];
  let acc = 0;
  cfg.groups.forEach((g) => {
    const span = g.members.length * SEG, center = acc + span / 2; acc += span;
    const rad = (center * Math.PI) / 180, lr = maxOuter + size * 0.055;
    labels.push(`<text x="${(cx + lr * Math.sin(rad)).toFixed(1)}" y="${(cy - lr * Math.cos(rad)).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="15.5" fill="#777">${g.name}</text>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="white"/>
${lines.join("\n")}
${labels.join("\n")}
<text x="${cx}" y="${size - 14}" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#444">${cfg.groups.length}カテゴリ (${NFAC}学部) / ${STRANDS}本 / ${AXISKEY} ${measured.length}軸計測 / ${INTERP}</text>
</svg>`;
}

const svg = render(PERSONA);
fs.writeFileSync(`${OUT}/${PREFIX}.svg`, svg);
console.log(`rendered ${PREFIX}.svg  (${cfg.groups.length}群 ${NFAC}学部 ${STRANDS}本 / ${AXISKEY} ${measured.length}軸)`);
console.log("スロット順 & スコア:");
const sc = fitness(PERSONA);
ordered.forEach((o, i) => console.log(`  ${String(i + 1).padStart(2)} ${o.fac.name.padEnd(14)} ${sc[active.indexOf(o.fac)]}`));
