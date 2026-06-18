"use client";

// mix（9×4）ゆらぐリングの調整ラボ（開発用・noindex・非リンク）。
// スライダーで動き/見た目を即反映し、気に入った値の JSON をそのまま伝えてもらう運用。
// ここで触るのは mix の AnimatedRing のみ。結果リング・文系/理系には影響しない。
import { useState } from "react";
import AnimatedRing, {
  DEFAULT_MIX_ANIM,
  type MixAnimConfig,
} from "@/components/AnimatedRing";
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
  const [anim, setAnim] = useState<MixAnimConfig>({ ...DEFAULT_MIX_ANIM });
  const [mp, setMp] = useState<MixRingParams>({ ...DEFAULT_MIX_PARAMS });

  const a = (k: keyof MixAnimConfig, v: number) => setAnim((s) => ({ ...s, [k]: v }));
  const p = (k: keyof MixRingParams, v: number) => setMp((s) => ({ ...s, [k]: v }));

  const motionRows: Row[] = [
    { key: "periodMs", label: "速さ periodMs（小=速い）", min: 300, max: 6000, step: 50, get: () => anim.periodMs, set: (v) => a("periodMs", v) },
    { key: "ampMin", label: "強度下限 ampMin（谷の深さ）", min: 0, max: 0.9, step: 0.01, get: () => anim.ampMin, set: (v) => a("ampMin", v) },
    { key: "ampMax", label: "強度上限 ampMax（山の高さ）", min: 0.1, max: 1, step: 0.01, get: () => anim.ampMax, set: (v) => a("ampMax", v) },
    { key: "waveSpread", label: "ゆらぎ分散 waveSpread（waveのみ）", min: 0, max: 1.5, step: 0.05, get: () => anim.waveSpread, set: (v) => a("waveSpread", v) },
  ];
  const visualRows: Row[] = [
    { key: "strands", label: "本数 strands", min: 36, max: 360, step: 4, get: () => mp.strands, set: (v) => p("strands", v) },
    { key: "lineWidth", label: "線の太さ lineWidth", min: 0.5, max: 8, step: 0.5, get: () => mp.lineWidth, set: (v) => p("lineWidth", v) },
    { key: "innerRatio", label: "内径 innerRatio（穴の大きさ）", min: 0.05, max: 0.4, step: 0.005, get: () => mp.innerRatio, set: (v) => p("innerRatio", v) },
    { key: "outerRatio", label: "外径 outerRatio（最大の長さ）", min: 0.25, max: 0.49, step: 0.005, get: () => mp.outerRatio, set: (v) => p("outerRatio", v) },
    { key: "minLenRatio", label: "谷の最小長 minLenRatio", min: 0, max: 0.1, step: 0.005, get: () => mp.minLenRatio, set: (v) => p("minLenRatio", v) },
  ];

  const json = JSON.stringify({ anim, mixParams: mp }, null, 2);
  const reset = () => {
    setAnim({ ...DEFAULT_MIX_ANIM });
    setMp({ ...DEFAULT_MIX_PARAMS });
    setSize(300);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-6 py-10">
      <h1 className="text-xl font-bold">ring-lab — mix ゆらぎリング調整（開発用）</h1>
      <p className="mt-1 text-xs text-gray-500">
        ここは mix の AnimatedRing 専用ラボ。スライダーで即反映。気に入った値の下の JSON
        をそのまま伝えてください（こちらでデフォルトに焼き込みます）。結果リング・文理リングには影響しません。
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* プレビュー */}
        <div className="flex flex-col items-center">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <AnimatedRing size={size} version="mixed" anim={anim} mixParams={mp} showLabels={false} />
          </div>
          <div className="mt-4 w-full max-w-xs">
            <Slider row={{ key: "size", label: "プレビューサイズ size", min: 120, max: 420, step: 10, get: () => size, set: setSize }} />
          </div>
          <div className="mt-3 flex gap-3">
            {(["sync", "wave"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setAnim((s) => ({ ...s, mode: m }))}
                className={`rounded-full border px-4 py-1.5 text-sm ${anim.mode === m ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700"}`}
              >
                {m === "sync" ? "sync（脈打つ）" : "wave（各点ゆらぐ）"}
              </button>
            ))}
            <button onClick={reset} className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700">
              リセット
            </button>
          </div>
        </div>

        {/* コントロール */}
        <div className="space-y-5">
          <div>
            <h2 className="mb-2 text-sm font-bold text-gray-800">動き</h2>
            <div className="space-y-3">
              {motionRows.map((r) => (
                <Slider key={r.key} row={r} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-gray-800">見た目</h2>
            <div className="space-y-3">
              {visualRows.map((r) => (
                <Slider key={r.key} row={r} />
              ))}
            </div>
          </div>
        </div>
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
