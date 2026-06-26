"use client";

import { useEffect, useRef } from "react";
import { drawRing, type DrawRingOpts } from "./ring-draw";
import type { Version } from "@/lib/questions";

type RingProps = {
  // リング制御点の強度配列。
  //   mixed: 36 学科の適合度（MIXED_RING_ORDER 順・確定デザイン new9x4r_A 方式）
  //   humanities / sciences: 8 カテゴリ強度
  strengths: number[];
  size?: number;
  showLabels?: boolean;
  version?: Version; // デフォルト "mixed"
  // 実験用（?ring/?fill/?lab/?ink で結果画面から渡す）。省略時は従来挙動。
  outerRatio?: number;
  labelStyle?: DrawRingOpts["labelStyle"];
  labelColor?: string;
};

// 静止リング（結果画面 = 実データ / 旧プレビュー）。描画本体は ring-draw.ts に切り出し済み。
export default function Ring({
  strengths,
  size = 300,
  showLabels = true,
  version = "mixed",
  outerRatio,
  labelStyle,
  labelColor,
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

    drawRing(ctx, size, strengths, showLabels, version, { outerRatio, labelStyle, labelColor });
  }, [strengths, size, showLabels, version, outerRatio, labelStyle, labelColor]);

  // ① リングが列幅より大きくても必ず水平中央（justify-center は overflow でも中央寄せ。
  //    mx-auto は「列より大きい」と左寄せ＋右はみ出しになり中心がズレるため不可）。
  // ② ラベル分の上下の空き（≒0.06*size）をマイナスマージンで詰めて見出し/Top3 に寄せる。
  const vCrop = showLabels ? Math.round(size * 0.06) : Math.round(size * 0.03);
  return (
    <div
      className="flex w-full justify-center"
      style={{ marginTop: -vCrop, marginBottom: -vCrop }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}
