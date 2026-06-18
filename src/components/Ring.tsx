"use client";

import { useEffect, useRef } from "react";
import {
  VERSION_CATEGORY_COLORS,
  VERSION_CATEGORY_NAMES,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  MIXED_RING_CATEGORY_INDEX,
} from "@/lib/departments";
import type { Version } from "@/lib/questions";

type RingProps = {
  // リング制御点の強度配列。
  //   mixed: 36 学科の適合度（MIXED_RING_ORDER 順・確定デザイン new9x4r_A 方式）
  //   humanities / sciences: 8 カテゴリ強度
  strengths: number[];
  size?: number;
  showLabels?: boolean;
  version?: Version; // デフォルト "mixed"
};

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// RGB 線形補間（理系版で使用）。
// 各成分を端から端まで直線で結ぶ ── 色相を経由しないので HSL 補間で起きる
// 「中点の鮮やかな緑/シアン」が出ない。中点で自然に彩度が落ちるが、
// 追加の脱彩度はかけない（過度にグレーになるのを避ける）。
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

// 隣接カテゴリ間を彩度を落とした淡い色（薄い紫・薄いピンク・薄いオレンジ・薄い黄など）を
// 経由して補間する。色相差が大きいほど中点で淡く（彩度↓・明度↑）なる U字カーブ。
//
// さらに、約180°差（寒色↔暖色を結ぶケース）の場合、短回りが寒色側を通ると
// 中間で「濃い緑→シアン→青」を経由してしまう。短回りの中点が寒色側にあるときは、
// 長回りに切り替えて暖色側（黄→オレンジ→ピンク→紫）を経由させる。
function lerpHsl(
  [h1, s1, l1]: [number, number, number],
  [h2, s2, l2]: [number, number, number],
  t: number
): string {
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;

  // 180°近辺で、短回りが寒色側(hue 90°〜270°)を通る場合は反対回り(暖色側)へ切り替え
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

// バージョン別の角度オフセット（セグメント0 の左端の位置、12時=0°）
//   humanities/sciences（8カテゴリ）: 「スロット0 とスロット1 の境界 = 12時」
//     → スロット0 の左端 = -45° (10時半)、中心 = -22.5° (11時)、右端 = 0° (12時)
//   humanities: 12時境界 = 深紅 ⇔ オレンジ
//   sciences:   12時境界 = コバルトブルー ⇔ ブライトアクア
//   mixed（9×4＝36制御点）: 12時 = seam（経営工[紫]↔数学[青]の境界）。
//     学科0=数学の中心は 5°（12時のすぐ右）。確定デザイン new9x4r_A と一致。
const ANGLE_OFFSETS: Record<Version, number> = {
  mixed: 0, // mixed は専用パスで描画（このオフセットは 8カテゴリ版でのみ使用）
  humanities: -45,
  sciences: -45,
};

export default function Ring({
  strengths,
  size = 300,
  showLabels = true,
  version = "mixed",
}: RingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    // 内径を小さく・外径を大きくして「バンド帯」を厚くする → 山と谷の差が見やすい。
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
      // render_grouping.ts の忠実移植。学科ごと(36)を確定順に並べて 144本を描く。
      const NFAC = normalizedStrengths.length; // 36
      const SEG = 360 / NFAC; // 10°
      const STRANDS = 144;
      // 制御点ごとの色（HSL）= その学科のカテゴリ色。4学科ごと同色なので
      // カテゴリ内は色平坦・境界だけ補間 → 9色グラデを維持。
      const facHsls = MIXED_RING_CATEGORY_INDEX.map((ci) =>
        hexToHsl(CATEGORY_COLORS[ci])
      );

      // alpha（12時=0°、時計回り）で制御点間をサンプル。
      // alpha = (i/STRANDS)*360。学科 j の中心 = (j+0.5)*SEG。
      // frac<0.5 → 直前学科との補間 / frac>=0.5 → 次学科との補間（renderer と同一）。
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
        // コサイン補間: 各制御点（山・谷の頂点）で傾き0 → 先端が丸くなる。
        // 値は t=0→lo, t=1→hi のままなので山谷の位置・高さは不変、形状だけ滑らかに。
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
        // alpha=0 を 12時、時計回り。canvas は angle-90 で上向きを作る。
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
        ctx.lineTo(
          cx + outerR * Math.cos(angleRad),
          cy + outerR * Math.sin(angleRad)
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = 2; // 線幅は現行のまま
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // カテゴリラベル（9個・各カテゴリ 4学科 = 45° の中央に配置）
      if (showLabels) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${size * 0.035}px sans-serif`;
        ctx.fillStyle = "#888";
        const N_CAT = CATEGORY_NAMES.length; // 9
        const catSpan = 4 * SEG; // 各カテゴリ = 4学科分 = 45°
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

      // 色: カテゴリ境界でグラデーション
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

      // 長さ: 正規化済みの強度を補間
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

    // カテゴリラベル
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
  }, [strengths, size, showLabels, version]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}
