"use client";

import { useEffect, useRef } from "react";
import { CATEGORY_COLORS } from "@/lib/departments";

// トップページ用のカラフルなリングアイコン（全色フル彩度、均等幅）

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

function lerpHsl(
  [h1, s1, l1]: [number, number, number],
  [h2, s2, l2]: [number, number, number],
  t: number
): string {
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = ((h1 + dh * t) % 360 + 360) % 360;
  const s = s1 + (s2 - s1) * t;
  const l = l1 + (l2 - l1) * t;
  return hslToString(h, s, l);
}

const LINE_COUNT = 120;

export default function RingIcon({ size = 140 }: { size?: number }) {
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
    const innerRadius = size * 0.3;
    const outerRadius = size * 0.46;
    const categoryHsls = CATEGORY_COLORS.map(hexToHsl);
    const segmentAngle = 360 / 8;

    for (let i = 0; i < LINE_COUNT; i++) {
      const angleDeg = (i / LINE_COUNT) * 360;
      const angleRad = ((angleDeg - 90) * Math.PI) / 180;

      const catPosition = angleDeg / segmentAngle;
      const catIndex = Math.floor(catPosition) % 8;
      const nextCatIndex = (catIndex + 1) % 8;
      const catFraction = catPosition - Math.floor(catPosition);

      const blendZone = 0.25;
      let color: string;
      if (catFraction < blendZone) {
        const prevCatIndex = (catIndex - 1 + 8) % 8;
        const t = 0.5 + (catFraction / blendZone) * 0.5;
        color = lerpHsl(categoryHsls[prevCatIndex], categoryHsls[catIndex], t);
      } else if (catFraction > 1 - blendZone) {
        const t = ((catFraction - (1 - blendZone)) / blendZone) * 0.5;
        color = lerpHsl(categoryHsls[catIndex], categoryHsls[nextCatIndex], t);
      } else {
        color = hslToString(...categoryHsls[catIndex]);
      }

      ctx.beginPath();
      ctx.moveTo(
        cx + innerRadius * Math.cos(angleRad),
        cy + innerRadius * Math.sin(angleRad)
      );
      ctx.lineTo(
        cx + outerRadius * Math.cos(angleRad),
        cy + outerRadius * Math.sin(angleRad)
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}
