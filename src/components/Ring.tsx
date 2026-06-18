"use client";

import { useEffect, useRef } from "react";
import { drawRing } from "./ring-draw";
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

// 静止リング（結果画面 = 実データ / 旧プレビュー）。描画本体は ring-draw.ts に切り出し済み。
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

    drawRing(ctx, size, strengths, showLabels, version);
  }, [strengths, size, showLabels, version]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}
