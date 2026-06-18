// ===== mix（9×4）ゆらぐリング専用レンダラ — ここだけを「いじりまくる」隔離ファイル =====
// 結果画面の Ring（ring-draw.ts の drawRing）とも、文系/理系の 8カテゴリ描画とも独立。
// ここの定数・描画を変えても mix のアニメプレビューにしか影響しない。
// HSL ヘルパも自前で持つ（ring-draw に手を入れずに色も自由にいじれるように）。
import { CATEGORY_COLORS, MIXED_RING_CATEGORY_INDEX } from "@/lib/departments";

// ---- 見た目パラメータ（/ring-lab のスライダー対象）----
export type MixRingParams = {
  strands: number; // 放射線の本数（多いほど密）
  innerRatio: number; // 内径 / size（リング中央の穴の大きさ）
  outerRatio: number; // 最大外径 / size（山の最大の長さ）
  minLenRatio: number; // 谷の最小長 / size（谷を完全に潰さない下限）
  lineWidth: number; // 線の太さ(px)
};

// デフォルト＝現行本番と同一（変更すると mix プレビューの初期見た目が変わる）。
export const DEFAULT_MIX_PARAMS: MixRingParams = {
  strands: 144,
  innerRatio: 0.16,
  outerRatio: 0.44,
  minLenRatio: 0.02,
  lineWidth: 2,
};

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

// 隣接カテゴリ色を淡色経由で補間（drawRing の lerpHsl と同系。mix 9色グラデ維持）。
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
    if (midShort > 90 && midShort < 270) dh = dh > 0 ? dh - 360 : dh + 360;
  }
  const h = ((h1 + dh * t) % 360 + 360) % 360;
  const hueDistance = Math.min(1, Math.abs(dh) / 180);
  const peakDesat = 0.6 * hueDistance;
  const peakLight = 0.22 * hueDistance;
  const u = 4 * t * (1 - t);
  const s = Math.max(0, (s1 + (s2 - s1) * t) * (1 - peakDesat * u));
  const l = Math.min(1, (l1 + (l2 - l1) * t) + peakLight * u);
  return hslToString(h, s, l);
}

// mix リング描画（clearRect + 36制御点をコサイン補間で strands 本に展開）。
// strengths は長さ36（各学科の強度）。アニメ側がフレーム毎に渡す。
export function drawMixRing(
  ctx: CanvasRenderingContext2D,
  size: number,
  strengths: number[],
  params: MixRingParams = DEFAULT_MIX_PARAMS
): void {
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const innerRadius = size * params.innerRatio;
  const maxOuterRadius = size * params.outerRatio;
  const minLineLength = size * params.minLenRatio;

  // ユーザー内 min-max 正規化（差を強調）: 最弱=0.05、最強=1.0。
  const minStr = Math.min(...strengths);
  const maxStr = Math.max(...strengths);
  const range = maxStr - minStr || 1;
  const norm = strengths.map((s) => 0.05 + ((s - minStr) / range) * 0.95);

  const NFAC = norm.length; // 36
  const SEG = 360 / NFAC;
  const STRANDS = Math.max(NFAC, Math.round(params.strands));

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
      v: norm[lo] + (norm[hi] - norm[lo]) * tt,
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
    ctx.lineWidth = params.lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}
