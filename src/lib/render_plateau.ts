// 台地(プラトー)型リング: 1学部=4本を同じ長さ(フラットな台地)にして凸凹に。
// 台地のつなぎ目(山の肩・谷の底)を smoothstep でなめらかに。肩幅 soft で柔らかさを可変。
//   soft=0   → カクカクの凸凹(各学部フラット・段差は垂直)
//   soft=0.5 → 完全になめらか(フラット部分ゼロ＝波)
// 値も色も「台地中央=学部の値/色で平坦、境界帯だけ smoothstep 補間」。山も谷も同じ式で丸くなる。
//
// 実行: <CA>/node_modules/.bin/tsc <CA>/src/lib/render_plateau.ts --outDir /tmp/rp --module commonjs \
//   --target es2020 --moduleResolution node --esModuleInterop ; node /tmp/rp/render_plateau.js <prefix> <soft>

import { departments, AXIS_COUNT } from "./departments";
import * as fs from "fs";

const OUT = "/tmp/ringdemo";
const PREFIX = process.argv[2] || "plateau";
const SOFT = process.argv[3] !== undefined ? parseFloat(process.argv[3]) : 0.3;
fs.mkdirSync(OUT, { recursive: true });

type Fac = { id: string; name: string; scores: number[]; gradExempt?: boolean };
const NEW: Fac[] = [
  { id: "dentistry", name: "歯学科", gradExempt: true, scores: [0.4, 0.9, 0.7, 0.3, 0.1, 0.4, 0.2, 0.8, 0.1, 0.1, 0.35, 0.5, 1.0, 0.0, 0.9, 0.05, 0.0, 0.05, 0.45, 0.25, 0.6, 0.1] },
  { id: "nutrition", name: "栄養学科", scores: [0.3, 0.7, 0.6, 0.3, 0.1, 0.15, 0.2, 0.85, 0.15, 0.1, 0.3, 0.55, 0.85, 0.15, 0.85, 0.1, 0.05, 0.05, 0.25, 0.3, 0.7, 0.2] },
  { id: "civil-eng", name: "土木・都市環境工学科", scores: [0.65, 0.3, 0.4, 0.6, 0.3, 0.85, 0.1, 0.25, 0.2, 0.3, 0.4, 0.6, 0.4, 0.4, 0.05, 0.0, 0.1, 0.1, 0.15, 0.3, 0.1, 0.5] },
  { id: "mgmt-eng", name: "経営工学科", scores: [0.7, 0.3, 0.15, 0.1, 0.6, 0.3, 0.15, 0.2, 0.75, 0.1, 0.5, 0.75, 0.2, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.05, 0.65] },
  { id: "materials-eng", name: "材料工学科", scores: [0.7, 0.3, 0.8, 0.0, 0.3, 0.6, 0.1, 0.1, 0.15, 0.1, 0.5, 0.35, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.45, 0.2, 0.65] },
];
const allFac: Fac[] = [...departments.map((d) => ({ id: d.id, name: d.name, scores: d.scores, gradExempt: d.gradExempt })), ...NEW];
const byName = new Map(allFac.map((f) => [f.name, f]));

type Group = { name: string; members: string[]; color: string };
const cfg: { strands?: number; groups: Group[] } = JSON.parse(fs.readFileSync("/tmp/grouping.json", "utf8"));

const ordered: { fac: Fac; color: string }[] = [];
for (const g of cfg.groups) for (const m of g.members) { const f = byName.get(m); if (!f) throw new Error(`unknown: ${m}`); ordered.push({ fac: f, color: g.color }); }
const active = ordered.map((o) => o.fac);
const NFAC = active.length;
const SEG = 360 / NFAC;
const STRANDS = cfg.strands || NFAC * 4;

// ===== v2判定式（active集合で再計算・mixed全22軸）=====
const GAMMA = 0.7, GATE_STRENGTH = 2.0, GATE_THRESHOLD = 0.45, ESSENTIAL = 0.8, GRAD_AXIS = 13, EPS = 1e-9, SIM_K = 0.35, SIM_P = 1.5;
const measured = [...Array(AXIS_COUNT).keys()];
const W = new Array(AXIS_COUNT).fill(0);
for (const i of measured) { let m = 0; for (const d of active) m += d.scores[i]; m /= active.length; let v = 0; for (const d of active) v += (d.scores[i] - m) ** 2; W[i] = Math.pow(Math.sqrt(v / active.length) + EPS, GAMMA); }
const essential = active.map((d) => new Set(measured.filter((i) => i !== GRAD_AXIS && d.scores[i] >= ESSENTIAL)));
function fitness(user: number[]): number[] {
  return active.map((d, di) => {
    let sum = 0;
    for (const i of measured) { if (i === GRAD_AXIS && d.gradExempt) continue; const diff = user[i] - d.scores[i]; sum += W[i] * diff * diff; }
    const dist = Math.sqrt(sum);
    let pen = 0; for (const i of essential[di]) if (user[i] < GATE_THRESHOLD) pen += GATE_THRESHOLD - user[i];
    return Math.round(Math.exp(-SIM_K * Math.pow(dist + GATE_STRENGTH * pen, SIM_P)) * 100);
  });
}

const PERSONAS: Record<string, number[]> = {
  A: [0.55, 0.40, 0.90, 0.10, 0.35, 0.45, 0.15, 0.10, 0.20, 0.05, 0.45, 0.35, 0.20, 0.65, 0.05, 0.05, 0.05, 0.05, 0.10, 0.55, 0.35, 0.70],
  B: [0.10, 0.60, 0.05, 0.20, 0.05, 0.05, 0.95, 0.25, 0.20, 0.60, 0.65, 0.30, 0.20, 0.45, 0.05, 0.05, 0.95, 0.30, 0.10, 0.65, 0.10, 0.05],
  C: [0.95, 0.30, 0.15, 0.05, 0.70, 0.10, 0.20, 0.05, 0.25, 0.05, 0.95, 0.30, 0.10, 0.80, 0.0, 0.0, 0.05, 0.10, 0.05, 0.85, 0.10, 0.20],
};

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
const hsls = ordered.map((o) => hexToHsl(o.color));
function normalize(v: number[]): number[] { const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1; return v.map((x) => 0.05 + ((x - mn) / r) * 0.95); }
const smoothstep = (x: number) => x * x * (3 - 2 * x);

// 台地サンプラ: 中央=フラット、境界±soft 帯だけ smoothstep。soft∈(0,0.5]
function sampleP(valNorm: number[], alpha: number, soft: number): { v: number; color: string } {
  const s = Math.max(1e-4, Math.min(0.5, soft));
  const a = ((alpha % 360) + 360) % 360, pos = a / SEG;
  const kf = ((Math.floor(pos) % NFAC) + NFAC) % NFAC, f = pos - Math.floor(pos);
  let lo: number, hi: number, t: number;
  if (f <= s) { lo = (kf - 1 + NFAC) % NFAC; hi = kf; t = (f + s) / (2 * s); }        // 左境界帯
  else if (f >= 1 - s) { lo = kf; hi = (kf + 1) % NFAC; t = (f - (1 - s)) / (2 * s); } // 右境界帯
  else { lo = kf; hi = kf; t = 0; }                                                    // 台地(フラット)
  const st = smoothstep(t);
  return { v: valNorm[lo] + (valNorm[hi] - valNorm[lo]) * st, color: lerpHsl(hsls[lo], hsls[hi], st) };
}

function render(persona: string): string {
  const sc = fitness(PERSONAS[persona]);
  const valNorm = normalize(ordered.map((o) => sc[active.indexOf(o.fac)]));
  const size = 820, cx = size / 2, cy = size / 2;
  const inner = size * 0.16, maxOuter = size * 0.355, minLen = size * 0.02, lw = 3.6;
  const lines: string[] = [];
  for (let i = 0; i < STRANDS; i++) {
    const alpha = (i / STRANDS) * 360, { v, color } = sampleP(valNorm, alpha, SOFT);
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
<text x="${cx}" y="${size - 14}" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#444">台地型 / 柔らかさ soft=${SOFT} / ${NFAC}学部 ${STRANDS}本 / ペルソナ${persona}</text>
</svg>`;
}

for (const p of ["A", "B", "C"]) fs.writeFileSync(`${OUT}/${PREFIX}_${p}.svg`, render(p));
console.log(`rendered ${PREFIX}_A/B/C.svg  (台地型 soft=${SOFT} ${NFAC}学部 ${STRANDS}本)`);
