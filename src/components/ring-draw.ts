// 結果画面リングの純関数（静止 Ring.tsx から呼ぶ描画本体）。
// canvas のサイズ設定・dpr スケールは呼び出し側で1回だけ行い、ここは clear + 描画のみ。
// 全版「学科単位」: 各学科の適合度を VERSION_RING_ORDER 順に並べた配列を制御点として描く
//   （mixed 36 / 理系 24 / 文系 13）。山谷は直線補間（尖り）、色は学科ごとに所属カテゴリ色を引く。
// 揺らぎ（AnimatedRing → mix-ring.ts drawMixRing）とは独立（あちらは集約モデル）。
import {
  VERSION_CATEGORY_COLORS,
  VERSION_CATEGORY_NAMES,
  VERSION_RING_CATEGORY_INDEX,
} from "@/lib/departments";
import type { Version } from "@/lib/questions";

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// RGB 線形補間（理系版で使用）。色相を経由しないので中点の鮮やかな緑/シアンが出ない。
export function lerpRgb(
  [r1, g1, b1]: [number, number, number],
  [r2, g2, b2]: [number, number, number],
  t: number
): string {
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s, l];
}

function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
}

// 隣接カテゴリ色を線形補間（色相は長回り切替あり）。彩度・明度は淡色化せず鮮やかなまま
// （boundarySat=1 相当・選択プレビュー drawMixRing と統一。2026-06-24 オーナー指示）。
// 約180°差で短回りが寒色側を通る場合は長回り（暖色側）へ切替。
function lerpHsl(
  [h1, s1, l1]: [number, number, number],
  [h2, s2, l2]: [number, number, number],
  t: number
): string {
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;

  if (Math.abs(dh) >= 150) {
    const midShort = ((h1 + dh / 2) % 360 + 360) % 360;
    if (midShort > 90 && midShort < 270) {
      dh = dh > 0 ? dh - 360 : dh + 360;
    }
  }

  const h = ((h1 + dh * t) % 360 + 360) % 360;

  // 境界を淡くせず鮮やかなまま（boundarySat=1 相当・選択プレビューと統一。2026-06-24 オーナー指示）。
  // 旧仕様: hueDistance に応じ peakDesat=0.6/peakLight=0.22 で境界中央(u=4t(1-t))を脱彩度・明色化していた。
  const s = Math.max(0, Math.min(1, s1 + (s2 - s1) * t));
  const l = Math.min(1, l1 + (l2 - l1) * t);

  return hslToString(h, s, l);
}

// バージョン別のリング描画設定（結果画面・学科単位）。
//   strands: 放射線の本数 / lwRatio: 線幅 = size × この比（820px デモの確定線幅を相対化）。
//   mixed/理系 = 5.4/820、文系 = 5.0/820。形は全版「尖り＝直線補間」（確定仕様 new9x4r_A）。
const RING_CFG: Record<Version, { strands: number; lwRatio: number }> = {
  mixed: { strands: 144, lwRatio: 5.4 / 820 },
  sciences: { strands: 144, lwRatio: 5.4 / 820 },
  humanities: { strands: 156, lwRatio: 5.0 / 820 },
};

// リング本体を描画する（clearRect + 山谷リング + カテゴリラベル）。
// strengths = 各学科の適合度を VERSION_RING_ORDER 順に並べた配列（mixed 36 / 理系 24 / 文系 13）。
// 色は学科ごとに所属カテゴリ色を引き、隣接学科間を直線補間（尖り）。
// 理系のみ RGB 線形補間（緑↔濃紺に紫が湧くのを防ぐ）、mixed/文系は HSL。
export function drawRing(
  ctx: CanvasRenderingContext2D,
  size: number,
  strengths: number[],
  showLabels: boolean,
  version: Version
): void {
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const innerRadius = size * 0.16;
  const maxOuterRadius = showLabels ? size * 0.34 : size * 0.44;
  const minLineLength = size * 0.02;

  // ユーザー内 min-max 正規化（差を強調）: 最弱=0.05、最強=1.0。
  const minStr = Math.min(...strengths);
  const maxStr = Math.max(...strengths);
  const range = maxStr - minStr || 1;
  const norm = strengths.map((s) => 0.05 + ((s - minStr) / range) * 0.95);

  const NFAC = norm.length; // mixed 36 / 理系 24 / 文系 13
  const SEG = 360 / NFAC;
  const cfg = RING_CFG[version];
  const STRANDS = cfg.strands;
  const lineWidth = size * cfg.lwRatio;
  const useRgb = version === "sciences";

  const categoryColors = VERSION_CATEGORY_COLORS[version];
  const ringCatIndex = VERSION_RING_CATEGORY_INDEX[version];
  // 制御点(学科)ごとの色 = 所属カテゴリの色。万一 NFAC を超える参照でも ?? 0 で安全に。
  const facHsls = Array.from({ length: NFAC }, (_, k) =>
    hexToHsl(categoryColors[ringCatIndex[k] ?? 0])
  );
  const facRgbs = Array.from({ length: NFAC }, (_, k) =>
    hexToRgb(categoryColors[ringCatIndex[k] ?? 0])
  );

  // 学科の頂点を中心に、隣接学科へ直線補間（頂点で角が立つ＝尖り）。色も同じ係数で補間。
  const sampleAt = (alpha: number): { v: number; color: string } => {
    const a = ((alpha % 360) + 360) % 360;
    const pos = a / SEG;
    const j0 = Math.floor(pos) % NFAC;
    const frac = pos - Math.floor(pos);
    let lo: number, hi: number, t: number;
    if (frac < 0.5) {
      lo = (j0 - 1 + NFAC) % NFAC;
      hi = j0;
      t = frac + 0.5;
    } else {
      lo = j0;
      hi = (j0 + 1) % NFAC;
      t = frac - 0.5;
    }
    const tt = t; // 直線補間＝尖り（確定仕様 new9x4r_A）
    const v = norm[lo] + (norm[hi] - norm[lo]) * tt;
    const color = useRgb
      ? lerpRgb(facRgbs[lo], facRgbs[hi], tt)
      : lerpHsl(facHsls[lo], facHsls[hi], tt);
    return { v, color };
  };

  for (let i = 0; i < STRANDS; i++) {
    const alpha = (i / STRANDS) * 360;
    const angleRad = ((alpha - 90) * Math.PI) / 180;
    const { v, color } = sampleAt(alpha);
    const lineLength =
      minLineLength + v * (maxOuterRadius - innerRadius - minLineLength);
    const outerR = innerRadius + lineLength;

    ctx.beginPath();
    ctx.moveTo(
      cx + innerRadius * Math.cos(angleRad),
      cy + innerRadius * Math.sin(angleRad)
    );
    ctx.lineTo(cx + outerR * Math.cos(angleRad), cy + outerR * Math.sin(angleRad));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  if (showLabels) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${size * 0.035}px sans-serif`;
    ctx.fillStyle = "#888";

    const categoryNames = VERSION_CATEGORY_NAMES[version];
    // カテゴリの占有弧（所属学科数 × SEG）。学科は連続配置なので累積で中央角を出す（不揃いも対応）。
    const counts = new Array(categoryNames.length).fill(0);
    for (const ci of ringCatIndex) counts[ci]++;
    let acc = 0;
    for (let c = 0; c < categoryNames.length; c++) {
      const span = counts[c] * SEG;
      const centerAlpha = acc + span / 2;
      acc += span;
      const angleRad = ((centerAlpha - 90) * Math.PI) / 180;
      const labelR = maxOuterRadius + size * 0.08;
      ctx.fillText(
        categoryNames[c],
        cx + labelR * Math.cos(angleRad),
        cy + labelR * Math.sin(angleRad)
      );
    }
  }
}
