"use client";

// mix ゆらぎリングの調整ラボ（開発用・noindex・非リンク）。
// 動き・形状・本数・線幅・内外径・回転・先端などはオーナー確定済み（DEFAULT に焼き込み）。
// 残る調整対象は「色境界」の3つだけ＝彩度倍率 / 明度倍率 / 境界の鮮やかさ。
// 気に入った値の JSON をそのまま伝えてください（こちらでデフォルトに焼き込みます）。
import { useState } from "react";
import AnimatedRing, { DEFAULT_MIX_ANIM } from "@/components/AnimatedRing";
import { DEFAULT_MIX_PARAMS, type MixRingParams } from "@/components/mix-ring";

type Row = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  get: () => number;
  set: (v: number) => void;
};

function Slider({ row }: { row: Row }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between text-xs text-gray-600">
        <span>{row.label}</span>
        <span className="font-mono text-gray-900">{row.get()}</span>
      </div>
      <input
        type="range"
        min={row.min}
        max={row.max}
        step={row.step}
        value={row.get()}
        onChange={(e) => row.set(parseFloat(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export default function RingLabPage() {
  const [size, setSize] = useState(300);
  // 調整対象は色境界の3つのみ。初期は鮮やか提案(midVivid=1)で確認しやすく。
  const [mp, setMp] = useState<MixRingParams>({
    ...DEFAULT_MIX_PARAMS,
    midVivid: 1,
  });
  const p = (k: keyof MixRingParams, v: number) =>
    setMp((s) => ({ ...s, [k]: v }));

  // 動き系は確定値で固定（スライダー撤去）。
  const anim = DEFAULT_MIX_ANIM;

  const rows: Row[] = [
    { key: "satMul", label: "彩度倍率 satMul（淡⇄鮮）", min: 0, max: 1.6, step: 0.05, get: () => mp.satMul, set: (v) => p("satMul", v) },
    { key: "lightMul", label: "明度倍率 lightMul（暗⇄明）", min: 0.6, max: 1.4, step: 0.05, get: () => mp.lightMul, set: (v) => p("lightMul", v) },
    { key: "midVivid", label: "境界の鮮やかさ midVivid（0=くすむ→1=鮮やか／紫⇄ピンク対策）", min: 0, max: 1, step: 0.05, get: () => mp.midVivid, set: (v) => p("midVivid", v) },
  ];

  const json = JSON.stringify({ anim, mixParams: mp }, null, 2);
  const reset = () => {
    setMp({ ...DEFAULT_MIX_PARAMS, midVivid: 1 });
    setSize(300);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">ring-lab — mix 色境界の調整（開発用）</h1>
      <p className="mt-1 text-xs text-gray-500">
        動き・形状・本数・線幅・内外径・回転・先端は確定済み（焼き込み済み）。ここでは
        「色境界」の3つだけ調整します。気に入った値の JSON を伝えてください。結果リング・文系/理系には影響しません。
      </p>

      <div className="mt-6 flex flex-col items-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <AnimatedRing size={size} version="mixed" anim={anim} mixParams={mp} showLabels={false} />
        </div>
        <div className="mt-4 w-full max-w-xs">
          <Slider row={{ key: "size", label: "プレビューサイズ size", min: 120, max: 420, step: 10, get: () => size, set: setSize }} />
        </div>
        <button
          onClick={reset}
          className="mt-3 rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700"
        >
          リセット
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-md space-y-4">
        {rows.map((r) => (
          <Slider key={r.key} row={r} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-bold text-gray-800">現在値（これを伝えてください）</h2>
        <textarea
          readOnly
          value={json}
          className="h-56 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs"
        />
      </div>
    </div>
  );
}
