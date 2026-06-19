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
  // 調整対象は「色の境界のグラデ」。初期は鮮やか提案(boundarySat1/Light0)で開く。
  const [mp, setMp] = useState<MixRingParams>({
    ...DEFAULT_MIX_PARAMS,
    boundarySat: 1,
    boundaryLight: 0,
  });
  const p = (k: keyof MixRingParams, v: number) =>
    setMp((s) => ({ ...s, [k]: v }));

  // 動き系は確定値で固定（スライダー撤去）。
  const anim = DEFAULT_MIX_ANIM;

  const rows: Row[] = [
    { key: "strands", label: "本数 strands（グラデの密度）", min: 36, max: 720, step: 4, get: () => mp.strands, set: (v) => p("strands", v) },
    { key: "boundarySat", label: "境界の彩度 boundarySat（<1くすむ／1元／>1濃く）", min: 0, max: 1.6, step: 0.05, get: () => mp.boundarySat, set: (v) => p("boundarySat", v) },
    { key: "boundaryLight", label: "境界の明度 boundaryLight（−暗⇄＋明・0=変化なし）", min: -0.4, max: 0.4, step: 0.02, get: () => mp.boundaryLight, set: (v) => p("boundaryLight", v) },
    { key: "boundaryWidth", label: "境界の幅 boundaryWidth（小=鋭い⇄大=滲む）", min: 0.3, max: 5, step: 0.1, get: () => mp.boundaryWidth, set: (v) => p("boundaryWidth", v) },
    { key: "boundaryHueBias", label: "境界の色相シフト boundaryHueBias（度・±で色味調整）", min: -60, max: 60, step: 2, get: () => mp.boundaryHueBias, set: (v) => p("boundaryHueBias", v) },
  ];

  const json = JSON.stringify({ anim, mixParams: mp }, null, 2);
  const reset = () => {
    setMp({ ...DEFAULT_MIX_PARAMS, boundarySat: 1, boundaryLight: 0 });
    setSize(300);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">ring-lab — mix 色境界の調整（開発用）</h1>
      <p className="mt-1 text-xs text-gray-500">
        動き・形状・線幅・内外径・回転・先端は確定済み。彩度倍率/明度倍率（全体）は1で固定。
        ここでは「色の境界のグラデ」＝本数・境界の彩度・境界の明度・境界の幅・色相シフトを調整します
        （同色の面には効かず、色が変わる境界だけに作用）。気に入った値の JSON を伝えてください。結果リング・文系/理系には影響しません。
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
