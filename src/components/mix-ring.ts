// ===== mix（9×4）ゆらぐリング専用レンダラ — ここだけを「いじりまくる」隔離ファイル =====
// 結果画面の Ring（ring-draw.ts の drawRing）とも、文系/理系の 8カテゴリ描画とも独立。
// ここの定数・描画を変えても mix のアニメプレビューにしか影響しない。
// HSL ヘルパも自前で持つ（ring-draw に手を入れずに色も自由にいじれるように）。
import { CATEGORY_COLORS } from "@/lib/departments";

// ---- 見た目パラメータ（/ring-lab のスライダー対象）----
export type MixRingParams = {
  strands: number; // 放射線の本数（多いほど密）
  innerRatio: number; // 内径 / size（リング中央の穴の大きさ）
  outerRatio: number; // 最大外径 / size（山の最大の長さ）
  minLenRatio: number; // 谷の最小長 / size（谷を完全に潰さない下限）
  lineWidth: number; // 線の太さ(px)
  rotationDeg: number; // リング全体の回転（度・時計回り）
  lineCap: "round" | "butt" | "square"; // 線の先端形
  satMul: number; // 【全体】彩度倍率（1=元・全リング一律）
  lightMul: number; // 【全体】明度倍率（1=元・全リング一律）
  // ===== 色の境界（色が変わる所）だけに効くグラデ調整。同色の面には効かない =====
  // 効きは「色相差×中央寄りの重み」で決まる＝カテゴリ内(同色)では0、境界でのみ作用。
  boundarySat: number; // 境界の彩度（中央）。1=変化なし(鮮やか) / <1でくすむ / >1で濃く
  boundaryLight: number; // 境界の明度オフセット（中央）。0=変化なし / +で明るく / −で暗く
  boundaryWidth: number; // 境界の幅(にじみ)。1=標準 / 大きいほど広く滲む / 小さいほど鋭い
  boundaryHueBias: number; // 境界の色相シフト(度)。中央の色味を±にずらす（0=変化なし）
  // cat7(法・政治・社会=ピンク)/cat4(生命・医療=黄)の色を差し替えるプレビュー用。
  // 既定は現行 CATEGORY_COLORS。本番に確定したら departments.ts 側を直接書き換える。
  pink: string;
  yellow: string;
};

// デフォルト＝現行本番と同一（変更すると mix プレビューの初期見た目が変わる）。
export const DEFAULT_MIX_PARAMS: MixRingParams = {
  strands: 144,
  innerRatio: 0.16,
  outerRatio: 0.44,
  minLenRatio: 0.02,
  lineWidth: 2,
  rotationDeg: 0,
  lineCap: "round",
  satMul: 1,
  lightMul: 1,
  // 既定＝従来の見た目（境界をくすませる旧U字 desat0.6/light+0.22 相当）。
  // boundarySat 0.4・boundaryLight 0.22 が旧「くすみ」と同等。鮮やか版(boundarySat1/light0)は
  // オーナーが /ring-lab で確認・OK後に bake する。
  boundarySat: 0.4,
  boundaryLight: 0.22,
  boundaryWidth: 1,
  boundaryHueBias: 0,
  pink: "#E05A9F", // 既定＝現行ピンク（本番不変）。ラボで案B等に差し替えて比較。
  yellow: "#F5D442", // 既定＝現行黄（本番不変）。ラボで案C等に差し替えて比較。
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

type BoundaryParams = {
  bSat: number; // 境界中央の彩度倍率（1=変化なし）
  bLight: number; // 境界中央の明度オフセット（0=変化なし）
  bHue: number; // 境界中央の色相シフト(度)（0=変化なし）
};
// 隣接カテゴリ色の補間 [h,s,l]。t は 0=lo純色 / 0.5=境界中央 / 1=hi純色。
// 彩度/明度/色相シフトは境界中央(t=0.5)で最大の U字 u で効かせる（端では0＝単色へ連続）。
// ※「にじみ幅」は呼び出し側の blendZone（色の変化が広がる角度幅）で決める。
function lerpHslTuple(
  [h1, s1, l1]: [number, number, number],
  [h2, s2, l2]: [number, number, number],
  t: number,
  bp: BoundaryParams
): [number, number, number] {
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  if (Math.abs(dh) >= 150) {
    const midShort = ((h1 + dh / 2) % 360 + 360) % 360;
    if (midShort > 90 && midShort < 270) dh = dh > 0 ? dh - 360 : dh + 360;
  }
  const hBase = ((h1 + dh * t) % 360 + 360) % 360;
  const u = 4 * t * (1 - t); // 端0→中央(t=0.5)1→端0
  const h = ((hBase + bp.bHue * u) % 360 + 360) % 360;
  const sBase = s1 + (s2 - s1) * t;
  const lBase = l1 + (l2 - l1) * t;
  const s = Math.min(1, Math.max(0, sBase * (1 + (bp.bSat - 1) * u)));
  const l = Math.min(1, Math.max(0, lBase + bp.bLight * u));
  return [h, s, l];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

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
  const band = Math.max(0, maxOuterRadius - innerRadius);
  // 谷の最小長は帯幅を超えないようクランプ（超えると山谷が反転するため）。
  const minLineLength = Math.min(size * params.minLenRatio, band);

  // ユーザー内 min-max 正規化（差を強調）: 最弱=0.05、最強=1.0。
  const minStr = Math.min(...strengths);
  const maxStr = Math.max(...strengths);
  const range = maxStr - minStr || 1;
  const norm = strengths.map((s) => 0.05 + ((s - minStr) / range) * 0.95);

  const NFAC = norm.length; // 36
  const SEG = 360 / NFAC;
  const STRANDS = Math.max(NFAC, Math.round(params.strands));

  const bp: BoundaryParams = {
    bSat: params.boundarySat,
    bLight: params.boundaryLight,
    bHue: params.boundaryHueBias,
  };

  // ===== 長さ（山谷）＝学部36制御点のコサイン補間（実データの形。色とは独立）=====
  const lenAt = (alpha: number): number => {
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
    return norm[lo] + (norm[hi] - norm[lo]) * tt;
  };

  // ===== 色＝9カテゴリ。boundaryWidth → 色が変わる角度幅 blendZone =====
  //   blendZone 小 → 各カテゴリ弧の中央は単色・境界だけ細く変化（鋭い）。
  //   blendZone=0.5 → 単色域が消え、中央まで隣色へ溶ける＝ほぼ連続な虹（最大の滲み）。
  // cat7(ピンク)/cat4(黄)を params で差し替え可能（本番焼き込み前の比較用）。
  const cols = CATEGORY_COLORS.map((c, i) =>
    i === 7 ? params.pink : i === 4 ? params.yellow : c
  );
  const catHslsArr = cols.map(hexToHsl); // 9
  const N_CAT = CATEGORY_COLORS.length; // 9
  const CAT_SPAN = 360 / N_CAT; // 40°
  const blendZone = Math.min(0.5, Math.max(0.01, params.boundaryWidth * 0.1));

  const colorAt = (alpha: number): string => {
    const a = ((alpha % 360) + 360) % 360;
    const pos = a / CAT_SPAN;
    const c0 = Math.floor(pos) % N_CAT;
    const frac = pos - Math.floor(pos);
    let h: number, s: number, l: number;
    if (frac < blendZone) {
      const lo = (c0 - 1 + N_CAT) % N_CAT;
      const t = 0.5 + (frac / blendZone) * 0.5; // 境界中央(0.5)→単色(1)
      [h, s, l] = lerpHslTuple(catHslsArr[lo], catHslsArr[c0], t, bp);
    } else if (frac > 1 - blendZone) {
      const hi = (c0 + 1) % N_CAT;
      const t = ((frac - (1 - blendZone)) / blendZone) * 0.5; // 単色(0)→境界中央(0.5)
      [h, s, l] = lerpHslTuple(catHslsArr[c0], catHslsArr[hi], t, bp);
    } else {
      [h, s, l] = catHslsArr[c0]; // 単色域（境界効果なし）
    }
    // 全体の彩度・明度倍率を適用。
    return hslToString(h, clamp01(s * params.satMul), clamp01(l * params.lightMul));
  };

  for (let i = 0; i < STRANDS; i++) {
    const alpha = (i / STRANDS) * 360;
    // -90 で12時起点、+rotationDeg で全体回転。
    const angleRad = ((alpha - 90 + params.rotationDeg) * Math.PI) / 180;
    const v = lenAt(alpha);
    const color = colorAt(alpha);
    const lineLength = minLineLength + v * (band - minLineLength);
    const outerR = innerRadius + lineLength;
    ctx.beginPath();
    ctx.moveTo(
      cx + innerRadius * Math.cos(angleRad),
      cy + innerRadius * Math.sin(angleRad)
    );
    ctx.lineTo(cx + outerR * Math.cos(angleRad), cy + outerR * Math.sin(angleRad));
    ctx.strokeStyle = color;
    ctx.lineWidth = params.lineWidth;
    ctx.lineCap = params.lineCap;
    ctx.stroke();
  }
}
