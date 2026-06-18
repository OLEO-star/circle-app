"use client";

import { useEffect, useRef } from "react";
import { drawRing } from "./ring-draw";
import {
  drawMixRing,
  DEFAULT_MIX_PARAMS,
  type MixRingParams,
} from "./mix-ring";
import { ringStrengthCount } from "@/lib/departments";
import type { Version } from "@/lib/questions";

// 「生きた」リング。診断前プレビュー用。各制御点の強度を動かし続け、山谷の長さが常に変化する。
// mix は専用の drawMixRing（src/components/mix-ring.ts）で描く＝結果リングと独立に「いじりまくれる」。
// 文系/理系は従来どおり共用 drawRing。

// ---- アニメ（動き）パラメータ（/ring-lab のスライダー対象）----
export type MixAnimConfig = {
  mode: "sync" | "wave"; // sync=全点が同じ目標へ脈打つ / wave=各点が独立にゆらぐ
  periodMs: number; // sync: 目標→次目標の時間 / wave: 基準周期（小さいほど速い）
  ampMin: number; // 強度の下限（谷の深さ）
  ampMax: number; // 強度の上限（山の高さ）
  waveSpread: number; // wave のみ: 各点の周期ばらつき（0=全点同期, 大きいほどバラバラに揺れる）
};

// デフォルト＝現行本番と同一の見た目（sync・2.6秒・0.15〜1.0）。
export const DEFAULT_MIX_ANIM: MixAnimConfig = {
  mode: "sync",
  periodMs: 2600,
  ampMin: 0.15,
  ampMax: 1.0,
  waveSpread: 0.6,
};

type AnimatedRingProps = {
  size?: number;
  version?: Version;
  showLabels?: boolean;
  anim?: Partial<MixAnimConfig>; // 省略時はデフォルト
  mixParams?: Partial<MixRingParams>; // mix の見た目（省略時はデフォルト）
  className?: string;
};

export default function AnimatedRing({
  size = 300,
  version = "mixed",
  showLabels = false,
  anim,
  mixParams,
  className,
}: AnimatedRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cfg: MixAnimConfig = { ...DEFAULT_MIX_ANIM, ...anim };
  const mp: MixRingParams = { ...DEFAULT_MIX_PARAMS, ...mixParams };
  // 依存配列用にプリミティブ化（オブジェクト参照差での無駄な再起動を避ける）。
  const cfgKey = JSON.stringify(cfg);
  const mpKey = JSON.stringify(mp);

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
    const isMix = version === "mixed";
    const render = (arr: number[]) => {
      if (isMix) drawMixRing(ctx, size, arr, mp);
      else drawRing(ctx, size, arr, showLabels, version);
    };

    const lo = cfg.ampMin;
    const span = Math.max(0, cfg.ampMax - cfg.ampMin);
    const randArr = () => Array.from({ length: n }, () => lo + Math.random() * span);

    // reduced-motion: 1枚だけ静止描画。
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      render(randArr());
      return;
    }

    let raf = 0;

    if (cfg.mode === "wave") {
      // 各点が独立した位相・周波数で sin 振動 → 連続的に「ゆらぐ」。
      const mid = (cfg.ampMin + cfg.ampMax) / 2;
      const half = Math.max(0, (cfg.ampMax - cfg.ampMin) / 2);
      const phase = Array.from({ length: n }, () => Math.random() * Math.PI * 2);
      const freqMul = Array.from(
        { length: n },
        () => 1 + (Math.random() * 2 - 1) * cfg.waveSpread
      );
      const baseW = (2 * Math.PI) / Math.max(1, cfg.periodMs);
      const frame = (ts: number) => {
        const arr = phase.map(
          (ph, i) => mid + half * Math.sin(ts * baseW * freqMul[i] + ph)
        );
        render(arr);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    } else {
      // sync: ランダム目標へコサイン ease で全点まとめて補間 → 脈打つ。
      const ease = (t: number) => (1 - Math.cos(Math.min(1, t) * Math.PI)) / 2;
      let from = randArr();
      let to = randArr();
      let segStart: number | null = null;
      const frame = (ts: number) => {
        if (segStart === null) segStart = ts;
        let t = (ts - segStart) / Math.max(1, cfg.periodMs);
        if (t >= 1) {
          from = to;
          to = randArr();
          segStart = ts;
          t = 0;
        }
        const e = ease(t);
        render(from.map((v, i) => v + (to[i] - v) * e));
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => cancelAnimationFrame(raf);
    // cfgKey / mpKey で設定変更時に再起動（/ring-lab のライブ反映用）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, version, showLabels, cfgKey, mpKey]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className ?? "mx-auto"}
    />
  );
}
