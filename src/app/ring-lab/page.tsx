"use client";

// 理系（sciences）ゆらぎリングの色境界グラデ調整ラボ（開発用・noindex・非リンク）。
// version="sciences" で本番と同じ理系リング（24学科単位・寒色ランプ）をそのまま描く。
// 境界の補間は mix と同じ HSL 方式に統一済みなので、本数＋境界4ツマミ（彩度/明度/にじみ幅/
// 色相）すべてが効く。気に入った値の JSON をそのまま伝えてください（デフォルトに焼き込みます）。
import { useState } from "react";
import AnimatedRing, { DEFAULT_MIX_ANIM } from "@/components/AnimatedRing";
import { DEFAULT_MIX_PARAMS, type MixRingParams } from "@/components/mix-ring";
import { SCIENCES_CATEGORY_COLORS } from "@/lib/departments";

// 濃淡候補。機械・電気(slot2)/生命・薬獣(slot6)が薄いので濃い案を用意（色相は維持）。
const MECH_OPTS: [string, string][] = [
  ["元", "#7ABFEB"],
  ["案A", "#5AA8E0"],
  ["案B", "#3D8AD0"],
  ["案C★", "#2A6FB8"],
];
const BIO_OPTS: [string, string][] = [
  ["元", "#2E8C9E"],
  ["案A", "#24788A"],
  ["案B", "#1B6374"],
  ["案C★", "#124E5C"],
];

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
  // 調整対象は「色の境界のグラデ」。理系プレビュー。
  const [mp, setMp] = useState<MixRingParams>({
    ...DEFAULT_MIX_PARAMS,
    boundarySat: 1,
    boundaryLight: 0,
  });
  const p = (k: keyof MixRingParams, v: number) =>
    setMp((s) => ({ ...s, [k]: v }));

  // 機械・電気(slot2)/生命・薬獣(slot6) の色を差し替えて濃淡を比較。
  const [mech, setMech] = useState<string>(SCIENCES_CATEGORY_COLORS[2]); // #7ABFEB
  const [bio, setBio] = useState<string>(SCIENCES_CATEGORY_COLORS[6]); // #2E8C9E
  // 理系パレット（slot2=機械電気 / slot6=生命薬獣 を差し替え）。
  const sciPalette = SCIENCES_CATEGORY_COLORS.map((c, i) =>
    i === 2 ? mech : i === 6 ? bio : c,
  );

  // 動き系は確定値で固定（スライダー撤去）。
  const anim = DEFAULT_MIX_ANIM;

  const rows: Row[] = [
    { key: "boundaryWidth", label: "境界の幅 boundaryWidth（小=鋭い⇄大=滲む）", min: 0.3, max: 5, step: 0.1, get: () => mp.boundaryWidth, set: (v) => p("boundaryWidth", v) },
    { key: "strands", label: "本数 strands（グラデの密度）", min: 36, max: 720, step: 4, get: () => mp.strands, set: (v) => p("strands", v) },
    { key: "boundarySat", label: "境界の彩度 boundarySat（<1くすむ／1元／>1濃く）", min: 0, max: 1.6, step: 0.05, get: () => mp.boundarySat, set: (v) => p("boundarySat", v) },
    { key: "boundaryLight", label: "境界の明度 boundaryLight（−暗⇄＋明・0=変化なし）", min: -0.4, max: 0.4, step: 0.02, get: () => mp.boundaryLight, set: (v) => p("boundaryLight", v) },
    { key: "boundaryHueBias", label: "境界の色相シフト boundaryHueBias（度・±で色味）", min: -60, max: 60, step: 2, get: () => mp.boundaryHueBias, set: (v) => p("boundaryHueBias", v) },
  ];

  const json = JSON.stringify(
    {
      anim,
      mixParams: mp,
      sciencesColors: { "機械・電気(slot2)": mech, "生命・薬獣(slot6)": bio },
    },
    null,
    2,
  );
  const reset = () => {
    setMp({ ...DEFAULT_MIX_PARAMS, boundarySat: 1, boundaryLight: 0 });
    setMech(SCIENCES_CATEGORY_COLORS[2]);
    setBio(SCIENCES_CATEGORY_COLORS[6]);
    setSize(300);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">ring-lab — 理系リング 色境界の調整（開発用）</h1>
      <p className="mt-1 text-xs text-gray-500">
        本番と同じ理系リング（24学科単位・寒色ランプ）のグラデーションを調整します。
        境界の補間は mix と同じ HSL 方式に統一したので、
        <span className="font-semibold text-gray-700">
          本数・境界の彩度・明度・にじみ幅・色相シフト
        </span>
        すべてが効きます（同色の面には効かず、色が変わる境界だけに作用）。
        気に入った値の JSON を伝えてください。結果リング・mix・文系には影響しません。
      </p>

      <div className="mt-6 flex flex-col items-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <AnimatedRing
            size={size}
            version="sciences"
            anim={anim}
            mixParams={mp}
            paletteOverride={sciPalette}
            showLabels={false}
          />
        </div>
        <div className="mt-4 w-full max-w-xs">
          <Slider row={{ key: "size", label: "プレビューサイズ size", min: 120, max: 420, step: 10, get: () => size, set: setSize }} />
        </div>

        {/* 濃淡プリセット：機械・電気 / 生命・薬獣（薄い2色を濃く） */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-gray-600">機械・電気:</span>
          {MECH_OPTS.map(([lab, hex]) => (
            <button
              key={hex}
              onClick={() => setMech(hex)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${mech === hex ? "border-gray-900 font-bold" : "border-gray-300 text-gray-700"}`}
            >
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: hex }} />
              {lab}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-gray-600">生命・薬獣:</span>
          {BIO_OPTS.map(([lab, hex]) => (
            <button
              key={hex}
              onClick={() => setBio(hex)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${bio === hex ? "border-gray-900 font-bold" : "border-gray-300 text-gray-700"}`}
            >
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: hex }} />
              {lab}
            </button>
          ))}
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
