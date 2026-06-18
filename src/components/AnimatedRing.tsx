"use client";

import { useEffect, useRef } from "react";
import { drawRing } from "./ring-draw";
import { ringStrengthCount } from "@/lib/departments";
import type { Version } from "@/lib/questions";

// 「生きた」リング。診断前のプレビュー用。
// パラメータ（各制御点の強度）をランダムな目標へ向けて滑らかに補間し続け、
// 山谷の長さが常に変化する＝結果リング（fin_mix.png）を動かしたような見た目になる。
// 結果画面の Ring（実データ・静止）とは別物。色・形状は drawRing を共用するので完全に同系統。
type AnimatedRingProps = {
  size?: number;
  version?: Version; // mixed=36制御点 / humanities・sciences=8
  showLabels?: boolean;
  periodMs?: number; // 1区間（現目標→次目標）の所要時間。小さいほど速い
  className?: string;
};

export default function AnimatedRing({
  size = 300,
  version = "mixed",
  showLabels = false,
  periodMs = 2600,
  className,
}: AnimatedRingProps) {
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

    const n = ringStrengthCount(version);
    // 目標パラメータ群。下限を少し上げて谷が潰れすぎないようにする。
    const randTargets = () =>
      Array.from({ length: n }, () => 0.15 + Math.random() * 0.85);
    // ease in-out（コサイン）。Ring の補間と同系統で滑らか。
    const ease = (t: number) => (1 - Math.cos(Math.min(1, t) * Math.PI)) / 2;

    // reduced-motion: 1枚だけ静止描画（動かさない・アクセシビリティ尊重）。
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      drawRing(ctx, size, randTargets(), showLabels, version);
      return;
    }

    let raf = 0;
    let from = randTargets();
    let to = randTargets();
    let segStart: number | null = null;

    const frame = (ts: number) => {
      if (segStart === null) segStart = ts;
      let t = (ts - segStart) / periodMs;
      if (t >= 1) {
        from = to;
        to = randTargets();
        segStart = ts;
        t = 0;
      }
      const e = ease(t);
      const cur = from.map((v, i) => v + (to[i] - v) * e);
      drawRing(ctx, size, cur, showLabels, version);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [size, version, showLabels, periodMs]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className ?? "mx-auto"}
    />
  );
}
