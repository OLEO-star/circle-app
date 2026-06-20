"use client";

import { useEffect, useRef } from "react";
import {
  drawMixRing,
  DEFAULT_MIX_PARAMS,
  type MixRingParams,
} from "./mix-ring";
import {
  ringStrengthCount,
  AXIS_COUNT,
  CATEGORY_COLORS,
  VERSION_CATEGORY_COLORS,
  VERSION_RING_CATEGORY_INDEX,
} from "@/lib/departments";
import {
  rankDepartments,
  calcRingStrengths,
  calcResultRingStrengths,
} from "@/lib/scoring";
import type { Version } from "@/lib/questions";

// 「生きた」リング。診断前プレビュー用。各制御点の強度を動かし続け、山谷の長さが常に変化する。
// 全版とも drawMixRing（mix-ring.ts）で描画＝同じレンダラ/動き。
// mix は 9色（pink/yellow 差し替え反映）、文系/理系は各版の 8色パレットを渡す。
// 結果リング（静止・Ring.tsx/drawRing）とは独立。

// ---- アニメ（動き）パラメータ（/ring-lab のスライダー対象）----
export type EaseMode = "cosine" | "linear" | "in" | "out" | "inout";

export type MixAnimConfig = {
  mode: "sync" | "wave"; // sync=全点が同じ目標へ脈打つ / wave=各点が独立にゆらぐ
  periodMs: number; // sync: 目標→次目標の時間 / wave: 基準周期（小さいほど速い）
  ampMin: number; // 強度の下限（谷の深さ）
  ampMax: number; // 強度の上限（山の高さ）
  waveSpread: number; // wave のみ: 各点の周期ばらつき（0=全点同期, 大きいほどバラバラに揺れる）
  // 速度カーブ（sync のみ）。cosine=現行(ゆっくり→速く→ゆっくり)/linear=等速/
  // in=だんだん速く/out=だんだん遅く/inout=強弱を easePower で誇張。
  easeMode: EaseMode;
  easePower: number; // in/out/inout の強弱（1≈穏やか, 大きいほど急加減速）
  // 形状ソース。real=ランダムな22軸プロフィールを本番判定式に通した「実際に起こりうる形」
  // （理系↑なら文系↓等の相関が出る）/ random=各点を独立にランダム（相関なし）。real は sync で有効。
  shape: "real" | "random";
};

// デフォルト＝オーナー確定値（2026-06-19 JSON）：sync・2.6秒・inout・real。
// 動き系はこの値で確定（/ring-lab から該当スライダーは撤去）。残る調整対象は色境界の3つのみ。
export const DEFAULT_MIX_ANIM: MixAnimConfig = {
  mode: "sync",
  periodMs: 2600,
  ampMin: 0.15,
  ampMax: 1.0,
  waveSpread: 0.6,
  easeMode: "inout",
  easePower: 2,
  shape: "real",
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

    // 文系/理系も「学科単位」で揺らがせる（mix と同じ細かさ＝理系24/文系13）。
    // 文系13はカテゴリあたり学科数が不揃いなので、色は等角分割でなく学科ごとのカテゴリ
    // index(catIdx)で引く。mix は従来どおり 36制御点＋等角9色（catIdx=null）。
    const catIdx =
      version === "mixed" ? null : VERSION_RING_CATEGORY_INDEX[version];
    const n = catIdx ? catIdx.length : ringStrengthCount(version);
    // 版ごとのパレット。mix はピンク/黄の差し替えを反映、文系/理系は各版の色（8色）。
    const palette =
      version === "mixed"
        ? CATEGORY_COLORS.map((c, i) => (i === 7 ? mp.pink : i === 4 ? mp.yellow : c))
        : [...VERSION_CATEGORY_COLORS[version]];
    // 全版とも HSL 境界補間（mix と同じ仕組み）。これで境界の彩度/明度/色相の
    // 調整が文系・理系にも効く。理系の寒色ランプは隣接色相差が小さく緑↔濃紺間に
    // 紫は湧かない並びなので RGB 専用パスは使わない（useRgb=false）。
    const render = (arr: number[]) =>
      drawMixRing(ctx, size, arr, mp, palette, false, catIdx ?? undefined);

    const lo = cfg.ampMin;
    const span = Math.max(0, cfg.ampMax - cfg.ampMin);
    const randArr = () => Array.from({ length: n }, () => lo + Math.random() * span);

    // 形状ソース real: ランダムな興味プロフィール(22軸)を本番の判定式に通して
    // 「実際に起こりうる学科適合度」を得る → 理系↑なら文系↓等の相関が自然に出る。
    const randomAxisVector = () => {
      const v = Array.from({ length: AXIS_COUNT }, () => Math.random() * 0.45);
      const peaks = 3 + Math.floor(Math.random() * 4); // 3〜6軸を強めに＝興味の尖りを作る
      for (let k = 0; k < peaks; k++) {
        v[Math.floor(Math.random() * AXIS_COUNT)] = 0.6 + Math.random() * 0.4;
      }
      return v;
    };
    // 実データの形。mix は 36学科、文系/理系は学科単位(24/13)の適合度を使う
    // （calcResultRingStrengths＝結果リングと同じ並び VERSION_RING_ORDER）。
    const realArr = () => {
      const ranked = rankDepartments(randomAxisVector(), version);
      return version === "mixed"
        ? calcRingStrengths(ranked, version)
        : calcResultRingStrengths(ranked, version);
    };
    // sync の目標値。real=本番判定式の出力 / random=独立ランダム。
    const nextTarget = () => (cfg.shape === "real" ? realArr() : randArr());

    // reduced-motion: 1枚だけ静止描画。
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      render(nextTarget());
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
      // sync: ランダム目標へ ease で全点まとめて補間 → 脈打つ。ease で速度の強弱を変える。
      const ep = Math.max(0.2, cfg.easePower);
      const ease = (t: number): number => {
        const x = Math.min(1, Math.max(0, t));
        switch (cfg.easeMode) {
          case "linear":
            return x;
          case "in":
            return Math.pow(x, ep);
          case "out":
            return 1 - Math.pow(1 - x, ep);
          case "inout":
            return x < 0.5
              ? 0.5 * Math.pow(2 * x, ep)
              : 1 - 0.5 * Math.pow(2 * (1 - x), ep);
          case "cosine":
          default:
            return (1 - Math.cos(x * Math.PI)) / 2;
        }
      };
      let from = nextTarget();
      let to = nextTarget();
      let segStart: number | null = null;
      const frame = (ts: number) => {
        if (segStart === null) segStart = ts;
        let t = (ts - segStart) / Math.max(1, cfg.periodMs);
        if (t >= 1) {
          from = to;
          to = nextTarget();
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
  }, [size, version, cfgKey, mpKey]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className ?? "mx-auto"}
    />
  );
}
