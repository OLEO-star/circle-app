// リング描画の純関数（Ring = 静止 / AnimatedRing = 毎フレーム から共用）。
// canvas のサイズ設定・dpr スケールは呼び出し側で1回だけ行い、ここは clear + 描画のみ。
// 中身は旧 Ring.tsx の useEffect 本体を忠実に切り出したもの（挙動不変）。
import {
  VERSION_CATEGORY_COLORS,
  VERSION_CATEGORY_NAMES,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  MIXED_RING_CATEGORY_INDEX,
} from "@/lib/departments";
import type { Version } from "@/lib/questions";

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// RGB 線形補間（理系版で使用）。色相を経由しないので中点の鮮やかな緑/シアンが出ない。
function lerpRgb(
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

// 隣接カテゴリ間を彩度を落とした淡い色を経由して補間する U字カーブ。
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

  const hueDistance = Math.min(1, Math.abs(dh) / 180);
  const peakDesat = 0.6 * hueDistance;
  const peakLight = 0.22 * hueDistance;
  const u = 4 * t * (1 - t);

  const sLin = s1 + (s2 - s1) * t;
  const lLin = l1 + (l2 - l1) * t;
  const s = Math.max(0, sLin * (1 - peakDesat * u));
  const l = Math.min(1, lLin + peakLight * u);

  return hslToString(h, s, l);
}

// バージョン別の角度オフセット（8カテゴリ版でのみ使用。mixed は専用パス）。
const ANGLE_OFFSETS: Record<Version, number> = {
  mixed: 0,
  humanities: -45,
  sciences: -45,
};

// リング本体を描画する。clearRect + 山谷リング + ラベル。
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
  const normalizedStrengths = strengths.map(
    (s) => 0.05 + ((s - minStr) / range) * 0.95
  );

  if (version === "mixed") {
    // ===== mixed: 9×4＝36制御点・144本・コサイン補間（確定デザイン new9x4r_A 方式）=====
    const NFAC = normalizedStrengths.length; // 36
    const SEG = 360 / NFAC; // 10°
    const STRANDS = 144;
    // 制御点ごとの色。通常 NFAC===36 で MIXED_RING_CATEGORY_INDEX と一致するが、
    // 万一 strengths が非36長でも添字落ち（undefined→hexToHsl 例外）しないよう NFAC 長で安全に引く。
    const facHsls = Array.from({ length: NFAC }, (_, k) =>
      hexToHsl(CATEGORY_COLORS[MIXED_RING_CATEGORY_INDEX[k] ?? 0])
    );

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
      const tt = (1 - Math.cos(t * Math.PI)) / 2;
      return {
        v:
          normalizedStrengths[lo] +
          (normalizedStrengths[hi] - normalizedStrengths[lo]) * tt,
        color: lerpHsl(facHsls[lo], facHsls[hi], tt),
      };
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
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    if (showLabels) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${size * 0.035}px sans-serif`;
      ctx.fillStyle = "#888";
      const N_CAT = CATEGORY_NAMES.length; // 9
      const catSpan = 4 * SEG; // 各カテゴリ = 4学科分 = 40°（9×40=360）
      for (let c = 0; c < N_CAT; c++) {
        const centerAlpha = c * catSpan + catSpan / 2;
        const angleRad = ((centerAlpha - 90) * Math.PI) / 180;
        const labelR = maxOuterRadius + size * 0.08;
        ctx.fillText(
          CATEGORY_NAMES[c],
          cx + labelR * Math.cos(angleRad),
          cy + labelR * Math.sin(angleRad)
        );
      }
    }
    return;
  }

  // ===== humanities / sciences: 8カテゴリ集約・120本・線形補間（従来どおり）=====
  const categoryColors = VERSION_CATEGORY_COLORS[version];
  const categoryNames = VERSION_CATEGORY_NAMES[version];
  const LINE_COUNT = 120;
  const N_CAT = categoryColors.length; // 8

  const categoryHsls = categoryColors.map(hexToHsl);
  const categoryRgbs = categoryColors.map(hexToRgb);
  const useRgb = version === "sciences";
  const blendColor = (i1: number, i2: number, t: number): string =>
    useRgb
      ? lerpRgb(categoryRgbs[i1], categoryRgbs[i2], t)
      : lerpHsl(categoryHsls[i1], categoryHsls[i2], t);
  const solidColor = (i: number): string => {
    if (useRgb) {
      const [r, g, b] = categoryRgbs[i];
      return `rgb(${r}, ${g}, ${b})`;
    }
    return hslToString(...categoryHsls[i]);
  };
  const segmentAngle = 360 / N_CAT;
  const offset = ANGLE_OFFSETS[version];

  for (let i = 0; i < LINE_COUNT; i++) {
    const angleDeg = (i / LINE_COUNT) * 360;
    const angleRad = ((angleDeg - 90 + offset) * Math.PI) / 180;

    const catPosition = angleDeg / segmentAngle;
    const catIndex = Math.floor(catPosition) % N_CAT;
    const nextCatIndex = (catIndex + 1) % N_CAT;
    const catFraction = catPosition - Math.floor(catPosition);

    const blendZone = 0.2;
    let color: string;
    if (catFraction < blendZone) {
      const prevCatIndex = (catIndex - 1 + N_CAT) % N_CAT;
      const t = 0.5 + (catFraction / blendZone) * 0.5;
      color = blendColor(prevCatIndex, catIndex, t);
    } else if (catFraction > 1 - blendZone) {
      const t = ((catFraction - (1 - blendZone)) / blendZone) * 0.5;
      color = blendColor(catIndex, nextCatIndex, t);
    } else {
      color = solidColor(catIndex);
    }

    const centerFraction = catFraction;
    let strength: number;
    if (centerFraction < 0.5) {
      const prevCatIndex = (catIndex - 1 + N_CAT) % N_CAT;
      const t = centerFraction + 0.5;
      strength =
        normalizedStrengths[prevCatIndex] +
        (normalizedStrengths[catIndex] - normalizedStrengths[prevCatIndex]) * t;
    } else {
      const t = centerFraction - 0.5;
      strength =
        normalizedStrengths[catIndex] +
        (normalizedStrengths[nextCatIndex] - normalizedStrengths[catIndex]) * t;
    }

    const lineLength =
      minLineLength + strength * (maxOuterRadius - innerRadius - minLineLength);
    const outerR = innerRadius + lineLength;

    ctx.beginPath();
    ctx.moveTo(
      cx + innerRadius * Math.cos(angleRad),
      cy + innerRadius * Math.sin(angleRad)
    );
    ctx.lineTo(cx + outerR * Math.cos(angleRad), cy + outerR * Math.sin(angleRad));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  if (showLabels) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${size * 0.035}px sans-serif`;
    ctx.fillStyle = "#888";

    for (let i = 0; i < N_CAT; i++) {
      const angleDeg = i * segmentAngle + segmentAngle / 2;
      const angleRad = ((angleDeg - 90 + offset) * Math.PI) / 180;
      const labelR = maxOuterRadius + size * 0.08;
      const lx = cx + labelR * Math.cos(angleRad);
      const ly = cy + labelR * Math.sin(angleRad);
      ctx.fillText(categoryNames[i], lx, ly);
    }
  }
}
