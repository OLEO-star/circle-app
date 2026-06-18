"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Ring from "@/components/Ring";
import RingIcon from "@/components/RingIcon";
import type { Version } from "@/lib/questions";
import { previewStrengths } from "@/lib/departments";
import { getStudentAge, setStudentAge } from "@/lib/school-mode";

// 開始前の見通し：セット数も見せて「分割されている＝細切れに進められる」と
// 認知させると、心理的負荷が下がり開始率が上がる（goal-gradient effect）。
const COUNT_INFO: Record<
  Version,
  { count: number; minutes: string; sets: number }
> = {
  mixed: { count: 66, minutes: "約10分", sets: 6 },
  humanities: { count: 45, minutes: "約8分", sets: 5 },
  sciences: { count: 51, minutes: "約9分", sets: 5 },
};

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<Version>("mixed");
  const [age, setAge] = useState("");
  // PC版（≥1024px / lg）かどうか。SSR とクライアント初回で同じ DOM を返すため
  // null 初期化し、マウント後に matchMedia を評価して確定する（result-v と同じ流儀）。
  // CSS の hidden/lg:block 二枚出しだと Ring の canvas が二重生成されるため、
  // JS レベルで片方だけをレンダーする方式にする。
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // 個人モードでの年齢入力を復元（再訪時の手間を省く）。
  useEffect(() => {
    setAge(getStudentAge());
  }, []);

  // PC版判定。マウント後に matchMedia を評価し、ブレークポイントの変化にも追従する。
  // SSR では実行されない（useEffect）。breakpoint = Tailwind lg = 1024px。
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = (v: "humanities" | "sciences") => {
    setSelected((prev) => (prev === v ? "mixed" : v));
  };

  const start = () => {
    // 「始める」は明示的な新規開始 → 途中保存・前回の集計送信フラグをクリア
    localStorage.setItem("quizVersion", selected);
    localStorage.removeItem("quizAnswers");
    localStorage.removeItem("quizCurrentSet");
    sessionStorage.removeItem("quizResult");
    sessionStorage.removeItem("quizResultSent");
    // 年齢は任意。空文字なら保存しない（クリア）。
    setStudentAge(age.trim());
    router.push("/quiz");
  };

  const info = COUNT_INFO[selected];

  // PC版（≥1024px）。状態・ハンドラはモバイルと完全共有し、レイアウトだけ
  // 中央 split hero に組み替える（StartDesktop.jsx 準拠）。コピー文言は不変更。
  // isDesktop が null（マウント前）/ false のときは下のモバイルJSXを返す。
  if (isDesktop) {
    return (
      <StartDesktopView
        selected={selected}
        toggle={toggle}
        age={age}
        setAge={setAge}
        start={start}
        info={info}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <Ring
          strengths={previewStrengths(selected)}
          version={selected}
          size={200}
          showLabels={false}
        />

        {/* 学部診断の趣旨を 2 行で伝える。
            上：promotion 焦点（やりたい・新しい発見）
            下：prevention 焦点（10分・無料・縛られない）
            「したいことがわからない」生徒の自己選別を促す導入文。 */}
        <div className="mt-6 mb-2">
          <p className="text-sm font-semibold leading-relaxed text-gray-900">
            「得意」じゃなくて
            <br />
            「やりたい」で選ぶ、学部診断。
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            何をしたいかわからない人ほど、
            <br />
            答えるうちに見えてくるものがあります。
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
            約10分・無料・結果に縛られません
          </p>
        </div>

        {/* 年齢入力（任意・データ集計用）。希望進路は診断後に結果ページで聞く設計。 */}
        <div className="mb-6 mt-6 text-left">
          <label className="mb-1 block text-xs text-gray-500">
            年齢（任意）
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例：17"
            min={10}
            max={30}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-gray-400">
            入力すると診断結果の傾向データに含まれます（個人を特定する情報は集めません）
          </p>
        </div>

        <p className="mb-2 text-center text-sm font-medium leading-snug text-gray-800">
          文理が決まっている方はこちら
          <br />
          <span className="text-xs font-normal text-gray-500">
            （選ばなければ全学科で比較）
          </span>
        </p>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => toggle("humanities")}
            className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
              selected === "humanities"
                ? "border-[#E03767] bg-[#FFEEF1] text-[#B8002F]"
                : "border-gray-200 text-gray-500 active:bg-gray-50"
            }`}
            aria-pressed={selected === "humanities"}
          >
            文系
          </button>
          <button
            onClick={() => toggle("sciences")}
            className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
              selected === "sciences"
                ? "border-[#1E40AF] bg-[#E8EFFF] text-[#1E40AF]"
                : "border-gray-200 text-gray-500 active:bg-gray-50"
            }`}
            aria-pressed={selected === "sciences"}
          >
            理系
          </button>
        </div>

        <button
          onClick={start}
          className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors active:bg-gray-700"
        >
          学部診断を始める
        </button>

        <p className="mt-3 text-xs text-gray-400">
          {info.count}問・{info.sets}セット・{info.minutes}
        </p>
        <p className="mt-1 text-[10px] text-gray-300">
          途中で閉じても再開できます
        </p>

        <div className="mt-8 flex justify-center gap-4 text-[10px] text-gray-400">
          <Link href="/terms" className="hover:text-gray-600">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-gray-600">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PC版（≥1024px / lg）のトップ：中央 split hero。
// デザイン正本: ui_kits/diagnostic-app-desktop/StartDesktop.jsx を踏襲。
// - 上：ロゴ行（リング型の小マークを実 div の二重円 border で表現／画像アセット不使用）
// - 中：split hero（左 = リング260 + 文理トグル ／ 縦罫線 ／ 右 = 見出し+補足+年齢+CTA）
// - 下：利用規約 / プライバシーポリシー
// 状態・ハンドラ・データはモバイルと完全共有（props で受け取るだけ）。
// 本物の <Ring> はモバイルと同一のものを使い、JS 分岐で片方だけレンダー＝canvas 二重生成なし。
// コピー文言はモバイル JSX と 1:1（別エージェント担当のため変更しない）。
// box-shadow / 疑似要素図形は不使用（hairline border + 実要素のみ）。
// ============================================================================
function StartDesktopView({
  selected,
  toggle,
  age,
  setAge,
  start,
  info,
}: {
  selected: Version;
  toggle: (v: "humanities" | "sciences") => void;
  age: string;
  setAge: (v: string) => void;
  start: () => void;
  info: { count: number; minutes: string; sets: number };
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-10 py-12">
      {/* ロゴ行（result-v PC ヘッダーと同じリング小マークで表現） */}
      <div className="mb-10 flex items-center gap-3">
        <span className="inline-flex shrink-0">
          <RingIcon size={24} />
        </span>
        <span className="text-lg font-bold tracking-tight">ring-map</span>
        <span className="text-xs text-gray-400">学部診断</span>
      </div>

      {/* split hero */}
      <div className="flex max-w-[880px] items-center gap-16">
        {/* 左：リング + 文理トグル */}
        <div className="flex shrink-0 flex-col items-center">
          <Ring
            strengths={previewStrengths(selected)}
            version={selected}
            size={260}
            showLabels={false}
          />

          <p className="mb-2 mt-5 text-center text-sm font-medium leading-snug text-gray-800">
            文理が決まっている方はこちら
            <br />
            <span className="text-xs font-normal text-gray-500">
              （選ばなければ全学科で比較）
            </span>
          </p>

          <div className="flex w-[260px] gap-2">
            <button
              onClick={() => toggle("humanities")}
              className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
                selected === "humanities"
                  ? "border-[#E03767] bg-[#FFEEF1] text-[#B8002F]"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
              aria-pressed={selected === "humanities"}
            >
              文系
            </button>
            <button
              onClick={() => toggle("sciences")}
              className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
                selected === "sciences"
                  ? "border-[#1E40AF] bg-[#E8EFFF] text-[#1E40AF]"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
              aria-pressed={selected === "sciences"}
            >
              理系
            </button>
          </div>
        </div>

        {/* 縦罫線（hairline） */}
        <div
          className="w-px self-stretch bg-gray-100"
          aria-hidden="true"
        />

        {/* 右：見出し + 補足 + 年齢入力 + CTA */}
        <div className="w-[360px]">
          {/* 上：promotion 焦点 / 下：prevention 焦点（モバイルと同一コピー） */}
          <h1 className="text-2xl font-bold leading-tight text-gray-900">
            「得意」じゃなくて
            <br />
            「やりたい」で選ぶ、学部診断。
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            何をしたいかわからない人ほど、
            <br />
            答えるうちに見えてくるものがあります。
          </p>

          {/* 年齢入力（任意・データ集計用） */}
          <div className="mb-6 mt-7 text-left">
            <label className="mb-1 block text-xs text-gray-500">
              年齢（任意）
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="例：17"
              min={10}
              max={30}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              入力すると診断結果の傾向データに含まれます（個人を特定する情報は集めません）
            </p>
          </div>

          <button
            onClick={start}
            className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            学部診断を始める
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            {info.count}問・{info.sets}セット・{info.minutes}
          </p>
          <p className="mt-1 text-center text-[10px] text-gray-300">
            約10分・無料・結果に縛られません ・ 途中で閉じても再開できます
          </p>
        </div>
      </div>

      <div className="mt-12 flex justify-center gap-5 text-[10px] text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:text-gray-600">
          プライバシーポリシー
        </Link>
      </div>
    </div>
  );
}
