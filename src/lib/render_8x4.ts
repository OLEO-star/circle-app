// 8カテゴリ×4学部 リング レンダラ（2026-06-17）
//
// 入力: /tmp/grouping.json = { groups: [{name, members:[4], color}] } を勾配順(8個)で。
//   8×4なら 案A(学部均等11.25°)=案B(カテゴリ均等45°) なので分岐不要・1本で描ける。
// 出力: /tmp/ringdemo/new8x4_*.svg（Persona A/B/C のフィットネス・128本・8新カテゴリラベル付き）。
//
// 実行(grouping.json 準備後):
//   <CA>/node_modules/.bin/tsc <CA>/src/lib/render_8x4.ts --outDir /tmp/r8 --module commonjs \
//     --target es2020 --moduleResolution node --esModuleInterop ; node /tmp/r8/render_8x4.js

import { rankDepartments, type DeptResult } from "./scoring";
import { departments, type Department } from "./departments";
import * as fs from "fs";

const OUT = "/tmp/ringdemo";
fs.mkdirSync(OUT, { recursive: true });

type Group = { name: string; members: string[]; color: string };
const grouping: { groups: Group[] } = JSON.parse(fs.readFileSync("/tmp/grouping.json", "utf8"));

// 名前→Department
const byName = new Map(departments.map((d) => [d.name, d]));
// 勾配順に学部を展開（各群4学部、群内はそのままの順）
const ordered: { dept: Department; color: string; groupIdx: number }[] = [];
grouping.groups.forEach((g, gi) => {
  for (const m of g.members) {
    const d = byName.get(m);
    if (!d) throw new Error(`unknown faculty: ${m}`);
    ordered.push({ dept: d, color: g.color, groupIdx: gi });
  }
});
if (ordered.length !== 32) throw new Error(`expected 32, got ${ordered.length}`);

const PERSONAS: Record<string, number[]> = {
  A: [0.55, 0.40, 0.90, 0.10, 0.35, 0.45, 0.15, 0.10, 0.20, 0.05, 0.45, 0.35, 0.20, 0.65, 0.05, 0.05, 0.05, 0.05, 0.10, 0.55, 0.35, 0.70],
  B: [0.10, 0.60, 0.05, 0.20, 0.05, 0.05, 0.95, 0.25, 0.20, 0.60, 0.65, 0.30, 0.20, 0.45, 0.05, 0.05, 0.95, 0.30, 0.10, 0.65, 0.10, 0.05],
  C: [0.95, 0.30, 0.15, 0.05, 0.70, 0.10, 0.20, 0.05, 0.25, 0.05, 0.95, 0.30, 0.10, 0.80, 0.0, 0.0, 0.05, 0.10, 0.05, 0.85, 0.10, 0.20],
};

// 色補間（HSL・Ring.tsx 移植）
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6; else if (max === g) h = ((b - r) / d + 2) / 6; else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
function lerpHsl([h1, s1, l1]: number[], [h2, s2, l2]: number[], t: number): string {
  let dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  if (Math.abs(dh) >= 150) { const m = (((h1 + dh / 2) % 360) + 360) % 360; if (m > 90 && m < 270) dh = dh > 0 ? dh - 360 : dh + 360; }
  const h = (((h1 + dh * t) % 360) + 360) % 360, hd = Math.min(1, Math.abs(dh) / 180), u = 4 * t * (1 - t);
  const s = Math.max(0, (s1 + (s2 - s1) * t) * (1 - 0.6 * hd * u)), l = Math.min(1, (l1 + (l2 - l1) * t) + 0.22 * hd * u);
  return `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
}
const hsls = ordered.map((o) => hexToHsl(o.color));

function normalize(v: number[]): number[] { const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1; return v.map((x) => 0.05 + ((x - mn) / r) * 0.95); }

// 8×4 = 各学部 11.25° 均等。中心 = (j+0.5)*11.25
const SEG = 360 / 32;
function sampleAt(valNorm: number[], alpha: number): { v: number; color: string } {
  const a = ((alpha % 360) + 360) % 360;
  const pos = a / SEG; // 0..32
  const j0 = Math.floor(pos) % 32, j1 = (j0 + 1) % 32;
  // 中心基準補間: 各学部中心は (j+0.5)*SEG。alpha の属する区間の前後中心で補間
  const frac = pos - Math.floor(pos); // 0..1（セルの左端=0）
  // 中心は frac=0.5。frac<0.5 は前学部中心との補間、>=0.5 は次学部中心
  let lo: number, hi: number, t: number;
  if (frac < 0.5) { lo = (j0 - 1 + 32) % 32; hi = j0; t = frac + 0.5; } else { lo = j0; hi = j1; t = frac - 0.5; }
  const v = valNorm[lo] + (valNorm[hi] - valNorm[lo]) * t;
  const color = lerpHsl(hsls[lo], hsls[hi], t);
  return { v, color };
}

function render(persona: string, strands: number, showLabels: boolean): string {
  const results: DeptResult[] = rankDepartments(PERSONAS[persona], "mixed");
  const score = new Map(results.map((r) => [r.department.id, r.score]));
  const raw = ordered.map((o) => score.get(o.dept.id)! / 100);
  const valNorm = normalize(raw);
  const size = 760, cx = size / 2, cy = size / 2;
  const inner = size * 0.16, maxOuter = showLabels ? size * 0.36 : size * 0.42, minLen = size * 0.02, lw = 4.0;
  const lines: string[] = [];
  for (let i = 0; i < strands; i++) {
    const alpha = (i / strands) * 360;
    const { v, color } = sampleAt(valNorm, alpha);
    const len = minLen + v * (maxOuter - inner - minLen);
    const rad = (alpha * Math.PI) / 180;
    const x1 = cx + inner * Math.sin(rad), y1 = cy - inner * Math.cos(rad);
    const x2 = cx + (inner + len) * Math.sin(rad), y2 = cy - (inner + len) * Math.cos(rad);
    lines.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/>`);
  }
  const labels: string[] = [];
  if (showLabels) {
    grouping.groups.forEach((g, gi) => {
      const centerDeg = gi * 45 + 22.5; // 各群45°の中央
      const rad = (centerDeg * Math.PI) / 180;
      const lr = maxOuter + size * 0.06;
      const lx = cx + lr * Math.sin(rad), ly = cy - lr * Math.cos(rad);
      labels.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="17" fill="#777">${g.name}</text>`);
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="white"/>
${lines.join("\n")}
${labels.join("\n")}
<text x="${cx}" y="${size - 16}" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#444">新8×4 / 128本 / ペルソナ${persona}</text>
</svg>`;
}

for (const p of ["A", "B", "C"]) {
  fs.writeFileSync(`${OUT}/new8x4_${p}.svg`, render(p, 128, true));
}
console.log("rendered:", ["A", "B", "C"].map((p) => `new8x4_${p}.svg`).join(", "));
console.log("\n勾配順の並び:");
grouping.groups.forEach((g, gi) => console.log(`  G${gi + 1} ${g.name} [${g.color}]: ${g.members.join(", ")}`));
