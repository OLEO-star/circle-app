// 過去の全リングパターンを「同じスコア(ペルソナA)」で一覧描画（2026-06-18）
// 各パターンはレイアウト/色/形は当時のまま、入力の診断結果(22軸)だけ統一して比較可能にする。
// 出力: /tmp/ringdemo/all_<i>_<key>.svg（パネルごと）。bash で PNG 化→PIL で1枚に montage。
//
// 実行: <CA>/node_modules/.bin/tsc <CA>/src/lib/render_all.ts --outDir /tmp/ra --module commonjs \
//   --target es2020 --moduleResolution node --esModuleInterop ; node /tmp/ra/render_all.js

import { departments, AXIS_COUNT } from "./departments";
import * as fs from "fs";

const OUT = "/tmp/ringdemo";
fs.mkdirSync(OUT, { recursive: true });

type Fac = { id: string; name: string; scores: number[]; gradExempt?: boolean };
const NEW: Fac[] = [
  { id: "dentistry", name: "歯学科", gradExempt: true, scores: [0.4, 0.9, 0.7, 0.3, 0.1, 0.4, 0.2, 0.8, 0.1, 0.1, 0.35, 0.5, 1.0, 0.0, 0.9, 0.05, 0.0, 0.05, 0.45, 0.25, 0.6, 0.1] },
  { id: "civil-eng", name: "土木・都市環境工学科", scores: [0.65, 0.3, 0.4, 0.6, 0.3, 0.85, 0.1, 0.25, 0.2, 0.3, 0.4, 0.6, 0.4, 0.4, 0.05, 0.0, 0.1, 0.1, 0.15, 0.3, 0.1, 0.5] },
  { id: "mgmt-eng", name: "経営工学科", scores: [0.7, 0.3, 0.15, 0.1, 0.6, 0.3, 0.15, 0.2, 0.75, 0.1, 0.5, 0.75, 0.2, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.05, 0.65] },
  { id: "materials-eng", name: "材料工学科", scores: [0.7, 0.3, 0.8, 0.0, 0.3, 0.6, 0.1, 0.1, 0.15, 0.1, 0.5, 0.35, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.45, 0.2, 0.65] },
];
const allFac: Fac[] = [...departments.map((d) => ({ id: d.id, name: d.name, scores: d.scores, gradExempt: d.gradExempt })), ...NEW];
const byName = new Map(allFac.map((f) => [f.name, f]));
const F = (n: string) => { const f = byName.get(n); if (!f) throw new Error("unknown: " + n); return f; };

// 同じスコア = ペルソナA の 22軸ベクトル（全パネル共通）
const PERSONA_A = [0.55, 0.40, 0.90, 0.10, 0.35, 0.45, 0.15, 0.10, 0.20, 0.05, 0.45, 0.35, 0.20, 0.65, 0.05, 0.05, 0.05, 0.05, 0.10, 0.55, 0.35, 0.70];

// ===== v2判定式（active集合で再計算）=====
const GAMMA = 0.7, GATE_STRENGTH = 2.0, GATE_THRESHOLD = 0.45, ESSENTIAL = 0.8, GRAD_AXIS = 13, EPS = 1e-9, SIM_K = 0.35, SIM_P = 1.5;
const M = [...Array(AXIS_COUNT).keys()];
function fitOver(active: Fac[], user: number[]): Map<string, number> {
  const W = new Array(AXIS_COUNT).fill(0);
  for (const i of M) { let m = 0; for (const d of active) m += d.scores[i]; m /= active.length; let v = 0; for (const d of active) v += (d.scores[i] - m) ** 2; W[i] = Math.pow(Math.sqrt(v / active.length) + EPS, GAMMA); }
  const ess = active.map((d) => new Set(M.filter((i) => i !== GRAD_AXIS && d.scores[i] >= ESSENTIAL)));
  const out = new Map<string, number>();
  active.forEach((d, di) => {
    let sum = 0; for (const i of M) { if (i === GRAD_AXIS && d.gradExempt) continue; const df = user[i] - d.scores[i]; sum += W[i] * df * df; }
    let pen = 0; for (const i of ess[di]) if (user[i] < GATE_THRESHOLD) pen += GATE_THRESHOLD - user[i];
    out.set(d.name, Math.exp(-SIM_K * Math.pow(Math.sqrt(sum) + GATE_STRENGTH * pen, SIM_P)) * 100);
  });
  return out;
}

// ===== 色 =====
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
const smoothstep = (x: number) => x * x * (3 - 2 * x);

// ===== セグメント構築 =====
type Group = { members: string[]; color: string };
type Seg = { val: number; hsl: number[]; span: number; start: number; center: number };
type Gran = "faculty" | "category";
type SpanMode = "facEqual" | "catEqual";

function buildSegs(groups: Group[], gran: Gran, spanMode: SpanMode): Seg[] {
  const active = groups.flatMap((g) => g.members.map(F));
  const fit = fitOver(active, PERSONA_A);
  const nG = groups.length, nF = active.length;
  const raw: { val: number; hex: string; span: number }[] = [];
  for (const g of groups) {
    if (gran === "category") {
      const val = g.members.reduce((s, m) => s + (fit.get(m) || 0), 0) / g.members.length;
      raw.push({ val, hex: g.color, span: spanMode === "catEqual" ? 360 / nG : (360 * g.members.length) / nF });
    } else {
      for (const m of g.members) {
        const span = spanMode === "facEqual" ? 360 / nF : (360 / nG) / g.members.length;
        raw.push({ val: fit.get(m) || 0, hex: g.color, span });
      }
    }
  }
  const mn = Math.min(...raw.map((r) => r.val)), mx = Math.max(...raw.map((r) => r.val)), rg = mx - mn || 1;
  let acc = 0;
  return raw.map((r) => { const span = r.span, start = acc; acc += span; return { val: 0.05 + ((r.val - mn) / rg) * 0.95, hsl: hexToHsl(r.hex), span, start, center: start + span / 2 }; });
}

// ===== サンプラ =====
type Interp = { type: "linear" } | { type: "cosine" } | { type: "plateau"; soft: number };
function sampleCenter(segs: Seg[], alpha: number, cosine: boolean) {
  const a = ((alpha % 360) + 360) % 360, n = segs.length;
  let lo: number, hi: number, c0: number, c1: number;
  if (a < segs[0].center) { lo = n - 1; hi = 0; c0 = segs[n - 1].center - 360; c1 = segs[0].center; }
  else { let i = 0; for (; i < n; i++) { const cN = i < n - 1 ? segs[i + 1].center : segs[0].center + 360; if (a >= segs[i].center && a < cN) break; } lo = i % n; hi = (i + 1) % n; c0 = segs[lo].center; c1 = hi === 0 ? segs[0].center + 360 : segs[hi].center; }
  let t = (a - c0) / (c1 - c0); t = Math.max(0, Math.min(1, t));
  const e = cosine ? (1 - Math.cos(t * Math.PI)) / 2 : t;
  return { v: segs[lo].val + (segs[hi].val - segs[lo].val) * e, color: lerpHsl(segs[lo].hsl, segs[hi].hsl, e) };
}
function samplePlateau(segs: Seg[], alpha: number, soft: number) {
  const s = Math.max(1e-4, Math.min(0.5, soft)), a = ((alpha % 360) + 360) % 360, n = segs.length;
  let i = 0; for (; i < n; i++) if (a >= segs[i].start && a < segs[i].start + segs[i].span) break; i = i % n;
  const f = (a - segs[i].start) / segs[i].span;
  let lo: number, hi: number, t: number;
  if (f <= s) { lo = (i - 1 + n) % n; hi = i; t = (f + s) / (2 * s); }
  else if (f >= 1 - s) { lo = i; hi = (i + 1) % n; t = (f - (1 - s)) / (2 * s); }
  else { lo = i; hi = i; t = 0; }
  const e = smoothstep(t);
  return { v: segs[lo].val + (segs[hi].val - segs[lo].val) * e, color: lerpHsl(segs[lo].hsl, segs[hi].hsl, e) };
}

function renderPanel(title: string, sub: string, segs: Seg[], strands: number, interp: Interp): string {
  const size = 560, cx = size / 2, cy = size / 2;
  const inner = size * 0.17, maxOuter = size * 0.36, minLen = size * 0.02, lw = size / strands * 1.7;
  const lines: string[] = [];
  for (let i = 0; i < strands; i++) {
    const alpha = (i / strands) * 360;
    const r = interp.type === "plateau" ? samplePlateau(segs, alpha, interp.soft) : sampleCenter(segs, alpha, interp.type === "cosine");
    const len = minLen + r.v * (maxOuter - inner - minLen), rad = (alpha * Math.PI) / 180;
    lines.push(`<line x1="${(cx + inner * Math.sin(rad)).toFixed(2)}" y1="${(cy - inner * Math.cos(rad)).toFixed(2)}" x2="${(cx + (inner + len) * Math.sin(rad)).toFixed(2)}" y2="${(cy - (inner + len) * Math.cos(rad)).toFixed(2)}" stroke="${r.color}" stroke-width="${lw.toFixed(2)}" stroke-linecap="round"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="white"/>
${lines.join("\n")}
<text x="${cx}" y="${size - 34}" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#222">${title}</text>
<text x="${cx}" y="${size - 12}" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#888">${sub}</text>
</svg>`;
}

// ===== 各パターンのレイアウト定義 =====
const C8 = { name: ["#4A7BF7", "#7B5CF5", "#E05A9F", "#EF5350", "#F59B42", "#F5D442", "#4CAF50", "#42C5D9"] }; // 現行8カテゴリ色
// 現行8カテゴリ（並びは22軸seriation・カウント3,3,4,3,3,5,4,7）
const GROUPS_8: Group[] = [
  { color: C8.name[0], members: ["数学科", "情報科学科", "データサイエンス学科"] },
  { color: C8.name[1], members: ["経済学科", "商学科", "経営学科"] },
  { color: C8.name[2], members: ["法学科", "政治学科", "社会学科", "国際関係学科"] },
  { color: C8.name[3], members: ["哲学科", "文学科", "外国語学科"] },
  { color: C8.name[4], members: ["教育学科", "スポーツ科学科", "心理学科"] },
  { color: C8.name[5], members: ["看護学科", "医学科", "獣医学科", "薬学科", "農学科"] },
  { color: C8.name[6], members: ["建築学科", "情報工学科", "機械工学科", "電気電子工学科"] },
  { color: C8.name[7], members: ["化学工学科", "応用化学科", "化学科", "生命化学科", "生物学科", "地球科学科", "物理学科"] },
];
// 8×4 再編
const GROUPS_8x4: Group[] = [
  { color: "#4A7BF7", members: ["数学科", "物理学科", "情報科学科", "情報工学科"] },
  { color: "#7B5CF5", members: ["電気電子工学科", "機械工学科", "化学工学科", "建築学科"] },
  { color: "#E05A9F", members: ["化学科", "応用化学科", "生命化学科", "生物学科"] },
  { color: "#EF5350", members: ["薬学科", "看護学科", "医学科", "獣医学科"] },
  { color: "#F59B42", members: ["農学科", "心理学科", "スポーツ科学科", "教育学科"] },
  { color: "#F5D442", members: ["データサイエンス学科", "経済学科", "経営学科", "商学科"] },
  { color: "#4CAF50", members: ["政治学科", "社会学科", "国際関係学科", "法学科"] },
  { color: "#42C5D9", members: ["哲学科", "文学科", "地球科学科", "外国語学科"] },
];
// 9×4（並び）
const NINE_MEMBERS: string[][] = [
  ["数学科", "情報科学科", "データサイエンス学科", "情報工学科"],
  ["物理学科", "化学科", "応用化学科", "生命化学科"],
  ["機械工学科", "電気電子工学科", "化学工学科", "材料工学科"],
  ["建築学科", "土木・都市環境工学科", "地球科学科", "農学科"],
  ["生物学科", "医学科", "歯学科", "獣医学科"],
  ["薬学科", "看護学科", "心理学科", "スポーツ科学科"],
  ["教育学科", "文学科", "哲学科", "外国語学科"],
  ["法学科", "政治学科", "社会学科", "国際関係学科"],
  ["経済学科", "経営学科", "商学科", "経営工学科"],
];
const PAL_ORIG9 = ["#4A7BF7", "#7B5CF5", "#E05A9F", "#EF5350", "#F59B42", "#F5D442", "#A8D820", "#4CAF50", "#42C5D9"];
const PAL_REV9 = ["#4A7BF7", "#42C5D9", "#4CAF50", "#A8D820", "#F5D442", "#F59B42", "#EF5350", "#E05A9F", "#7B5CF5"];
const PAL_EVEN = ["#527CE0", "#8652E0", "#E052DC", "#E0527C", "#E08652", "#DCE052", "#7CE052", "#52E086", "#52DCE0"];
const PAL_MUTED = ["#8199CF", "#9E81CF", "#CF81CD", "#CF8199", "#CF9E81", "#CDCF81", "#99CF81", "#81CF9E", "#81CDCF"];
const PAL_DEEP = ["#3060CF", "#6A30CF", "#CF30C9", "#CF3060", "#CF6A30", "#C9CF30", "#60CF30", "#30CF6A", "#30C9CF"];
const nine = (pal: string[]): Group[] => NINE_MEMBERS.map((m, i) => ({ members: m, color: pal[i] }));

type Panel = { key: string; title: string; sub: string; groups: Group[]; gran: Gran; spanMode: SpanMode; strands: number; interp: Interp };
const PANELS: Panel[] = [
  { key: "01_cur8", title: "① 現行 8カテゴリ", sub: "8山谷・カテゴリ集約（本番）", groups: GROUPS_8, gran: "category", spanMode: "catEqual", strands: 120, interp: { type: "linear" } },
  { key: "02_32A", title: "② 32学部 案A", sub: "学部均等・32×11.25°", groups: GROUPS_8, gran: "faculty", spanMode: "facEqual", strands: 128, interp: { type: "linear" } },
  { key: "03_32B", title: "③ 32学部 案B", sub: "カテゴリ均等・8×45°細分", groups: GROUPS_8, gran: "faculty", spanMode: "catEqual", strands: 128, interp: { type: "linear" } },
  { key: "04_8x4", title: "④ 8×4 再編 (32学部)", sub: "8群×4・案A=案B", groups: GROUPS_8x4, gran: "faculty", spanMode: "facEqual", strands: 128, interp: { type: "linear" } },
  { key: "05_9x4sharp", title: "⑤ 9×4 (36学部) 尖り", sub: "直線補間・初期配色", groups: nine(PAL_ORIG9), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "linear" } },
  { key: "06_9x4round", title: "⑥ 9×4 丸み (現採用)", sub: "コサイン補間・配色逆順", groups: nine(PAL_REV9), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "cosine" } },
  { key: "07_plat0", title: "⑦ 台地 soft=0", sub: "凸凹・各学部4本フラット", groups: nine(PAL_REV9), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "plateau", soft: 0.001 } },
  { key: "08_plat18", title: "⑧ 台地 soft=0.18", sub: "肩と谷にやや丸み", groups: nine(PAL_REV9), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "plateau", soft: 0.18 } },
  { key: "09_plat33", title: "⑨ 台地 soft=0.33", sub: "しっかり丸み", groups: nine(PAL_REV9), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "plateau", soft: 0.33 } },
  { key: "10_plat50", title: "⑩ 台地 soft=0.5", sub: "完全になめらか（波）", groups: nine(PAL_REV9), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "plateau", soft: 0.5 } },
  { key: "11_palEven", title: "⑪ 配色: 均等hue", sub: "9×4丸み・別パレット案", groups: nine(PAL_EVEN), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "cosine" } },
  { key: "12_palMuted", title: "⑫ 配色: パステル", sub: "9×4丸み・別パレット案", groups: nine(PAL_MUTED), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "cosine" } },
  { key: "13_palDeep", title: "⑬ 配色: 深め", sub: "9×4丸み・別パレット案", groups: nine(PAL_DEEP), gran: "faculty", spanMode: "facEqual", strands: 144, interp: { type: "cosine" } },
];

for (const p of PANELS) {
  const segs = buildSegs(p.groups, p.gran, p.spanMode);
  fs.writeFileSync(`${OUT}/all_${p.key}.svg`, renderPanel(p.title, p.sub, segs, p.strands, p.interp));
}
console.log("rendered " + PANELS.length + " panels (同一スコア=ペルソナA):");
PANELS.forEach((p) => console.log(`  all_${p.key}.svg  ${p.title} — ${p.sub}`));
