"use client";

// 理系（sciences）ゆらぎリングの調整ラボ（開発用・noindex・非リンク）。
// version="sciences" で本番と同じ理系リング（24学科単位・寒色ランプ）をそのまま描く。
// 色は8カテゴリ＝学部を選んで1色ずつ独立に編集（パラメータ位置は1か所＝下のカラーピッカー）。
// 境界の補間は mix と同じ HSL 方式なので、本数＋境界4ツマミ（彩度/明度/にじみ幅/色相）も効く。
// 気に入った値の JSON をそのまま伝えてください（本番パレットに焼き込みます）。
import { useState } from "react";
import AnimatedRing, { DEFAULT_MIX_ANIM } from "@/components/AnimatedRing";
import { DEFAULT_MIX_PARAMS, type MixRingParams } from "@/components/mix-ring";
import { SCIENCES_CATEGORY_NAMES } from "@/lib/departments";

// 新しい理系8色の初期値（オーナー指定：黒っぽい濃い青緑→緑のランプ）。
// slot 順＝リングの並び順。各色はラボで1つずつ独立に編集できる。
const NEW_SCI_COLORS = [
  "#0B2623", // 0 数理・理論     : 黒（とても濃い青緑）
  "#13266B", // 1 情報・データ   : 紺
  "#1A45C0", // 2 機械・電気     : 濃い青
  "#2E74E8", // 3 物質・化学     : 青
  "#6FC2F0", // 4 環境・構造     : 水色
  "#10C29A", // 5 地球・生物     : 青緑（エメラルドグリーン）
  "#2BD07C", // 6 獣医・生命・薬学: 緑の強い青緑
  "#46C84F", // 7 医療・臨床     : 緑
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
  const [mp, setMp] = useState<MixRingParams>({
    ...DEFAULT_MIX_PARAMS,
    boundarySat: 1,
    boundaryLight: 0,
  });
  const p = (k: keyof MixRingParams, v: number) =>
    setMp((s) => ({ ...s, [k]: v }));

  // 8カテゴリの色（学部ごとに独立編集）。selCat=今編集中の学部。
  const [sciColors, setSciColors] = useState<string[]>([...NEW_SCI_COLORS]);
  const [selCat, setSelCat] = useState(0);
  const setColor = (idx: number, hex: string) =>
    setSciColors((arr) => arr.map((c, i) => (i === idx ? hex : c)));

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
      sciencesColors: SCIENCES_CATEGORY_NAMES.map((name, i) => ({
        slot: i,
        name,
        hex: sciColors[i],
      })),
    },
    null,
    2,
  );
  const reset = () => {
    setMp({ ...DEFAULT_MIX_PARAMS, boundarySat: 1, boundaryLight: 0 });
    setSciColors([...NEW_SCI_COLORS]);
    setSelCat(0);
    setSize(300);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-10">
      <h1 className="text-xl font-bold">ring-lab — 理系リング 色・グラデの調整（開発用）</h1>
      <p className="mt-1 text-xs text-gray-500">
        本番と同じ理系リング（24学科単位・寒色ランプ）を調整します。
        <span className="font-semibold text-gray-700">
          学部（カテゴリ）を選んで、その1色だけを独立に編集
        </span>
        できます（下のカラーピッカー1か所で、選んだ学部の色を変更）。
        境界の補間は mix と同じ HSL 方式なので本数・境界の彩度/明度/にじみ幅/色相も効きます。
        気に入った値の JSON を伝えてください。結果リング・mix・文系には影響しません。
      </p>

      <div className="mt-6 flex flex-col items-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <AnimatedRing
            size={size}
            version="sciences"
            anim={anim}
            mixParams={mp}
            paletteOverride={sciColors}
            showLabels={false}
          />
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

      {/* 学部ごとの色編集：8カテゴリを選択 → 下のピッカーでその色だけ独立に変更 */}
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold text-gray-700">
          学部（カテゴリ）の色 — 選んで個別に編集
        </p>
        <div className="flex flex-wrap gap-2">
          {SCIENCES_CATEGORY_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => setSelCat(i)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                selCat === i
                  ? "border-gray-900 font-bold"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: sciColors[i] }}
              />
              {name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gray-600">
            編集中：
            <span className="font-semibold text-gray-900">
              {SCIENCES_CATEGORY_NAMES[selCat]}
            </span>
          </span>
          <input
            type="color"
            value={sciColors[selCat]}
            onChange={(e) => setColor(selCat, e.target.value)}
            className="h-9 w-14 cursor-pointer rounded border border-gray-300 bg-white"
            aria-label={`${SCIENCES_CATEGORY_NAMES[selCat]} の色`}
          />
          <input
            type="text"
            value={sciColors[selCat]}
            onChange={(e) => setColor(selCat, e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1 font-mono text-xs"
            spellCheck={false}
          />
        </div>
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
