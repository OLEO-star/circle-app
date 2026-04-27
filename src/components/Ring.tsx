"use client";

import { useEffect, useRef } from "react";
import {
  VERSION_CATEGORY_COLORS,
  VERSION_CATEGORY_NAMES,
} from "@/lib/departments";
import type { Version } from "@/lib/questions";

type RingProps = {
  strengths: number[]; // 8カテゴリの強度 (0.0〜1.0)
  size?: number;
  showLabels?: boolean;
  version?: Version; // デフォルト "mixed"
};

// HSLでの色補間用
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

const LINE_COUNT = 120;

// バージョン別の角度オフセット（セグメント0 の左端の位置、12時=0°）
//   全バージョンで「スロット0 とスロット1 の境界 = 12時」に統一
//   → スロット0 の左端 = -45° (10時半)、中心 = -22.5° (11時)、右端 = 0° (12時)
//   humanities: 12時境界 = 深紅 ⇔ オレンジ
//   sciences:   12時境界 = コバルトブルー ⇔ ブライトアクア
//   mixed:      12時境界 = 数理・情報 ⇔ 経済・ビジネス（右半分≒文系・左半分≒理系）
const ANGLE_OFFSETS: Record<Version, number> = {
  mixed: -45,
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
    const categoryColors = VERSION_CATEGORY_COLORS[version];
    const categoryNames = VERSION_CATEGORY_NAMES[version];

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
    // ラベル表示時もできるだけ大きく取りたいが、長いラベルが canvas 外に出ないよう
    // ラベル分の余白だけは残す。
    const innerRadius = size * 0.16;
    const maxOuterRadius = showLabels ? size * 0.34 : size * 0.44;
    const minLineLength = size * 0.02;

    // ユーザー内でのmin-max正規化（差を強調する）
    const minStr = Math.min(...strengths);
    const maxStr = Math.max(...strengths);
    const range = maxStr - minStr || 1;
    // 正規化: 最弱=0.05, 最強=1.0。最弱バーは芯近くまで沈み、最強バーは外周まで伸びる
    // → 山と谷のコントラストが明確になる。
    const normalizedStrengths = strengths.map(
      (s) => 0.05 + ((s - minStr) / range) * 0.95
    );

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
    const segmentAngle = 360 / 8;
    const offset = ANGLE_OFFSETS[version];

    for (let i = 0; i < LINE_COUNT; i++) {
      const angleDeg = (i / LINE_COUNT) * 360;
      const angleRad = ((angleDeg - 90 + offset) * Math.PI) / 180;

      const catPosition = angleDeg / segmentAngle;
      const catIndex = Math.floor(catPosition) % 8;
      const nextCatIndex = (catIndex + 1) % 8;
      const catFraction = catPosition - Math.floor(catPosition);

      // 色: カテゴリ境界でグラデーション
      const blendZone = 0.2;
      let color: string;
      if (catFraction < blendZone) {
        const prevCatIndex = (catIndex - 1 + 8) % 8;
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
        const prevCatIndex = (catIndex - 1 + 8) % 8;
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

      for (let i = 0; i < 8; i++) {
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
