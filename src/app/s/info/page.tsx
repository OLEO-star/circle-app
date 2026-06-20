"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimatedRing from "@/components/AnimatedRing";
import {
  getSchoolInfo,
  isSchoolMode,
  setStudentInfo,
  type SchoolInfo,
} from "@/lib/school-mode";
import type { Version } from "@/lib/questions";

// プレビューは AnimatedRing（version 別の制御点数で内部生成・常時アニメ）を使う。
// 文理選択でリング色・形が変わるので、学校モードでも個人モードと同じ視覚的フィードバックを得られる。

// ホーム（/）と同じ問題数表示にする。ユーザーが「全学科で比較」を選んだ場合の
// セット数・分数を見せて開始の心理的負荷を下げる（goal-gradient effect）。
const COUNT_INFO: Record<
  Version,
  { count: number; minutes: string; sets: number }
> = {
  mixed: { count: 66, minutes: "約10分", sets: 6 },
  humanities: { count: 45, minutes: "約8分", sets: 5 },
  sciences: { count: 51, minutes: "約9分", sets: 5 },
};

export default function StudentInfoPage() {
  const router = useRouter();
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [grade, setGrade] = useState("");
  const [klass, setKlass] = useState("");
  const [number, setNumber] = useState("");
  const [version, setVersion] = useState<Version>("mixed");
  // 「学部診断を始める」を一度でも押したか。押した後に未入力欄を赤枠にして
  // 何が足りないか視覚的に示す（disabled で押せないより理由が伝わる）。
  const [attempted, setAttempted] = useState(false);
  // PC版（≥1024px / lg）かどうか。SSR とクライアント初回で同じ DOM を返すため
  // null 初期化し、マウント後に matchMedia を評価して確定する（result-v/page.tsx と同じ流儀）。
  // null の間はモバイルJSXを返す（SSRはモバイル前提）→ マウント後に PC幅なら切替。
  // CSS の hidden/lg:block 二枚出しだと canvas リングが二重生成されるため、
  // JSレベルで片方だけをレンダーする方式にする。
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSchoolMode()) {
      router.replace("/s");
      return;
    }
    const info = getSchoolInfo();
    if (!info) {
      router.replace("/s/select");
      return;
    }
    setSchool(info);
  }, [router]);

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

  const canProceed =
    grade !== "" && klass.trim().length > 0 && number.trim().length > 0;

  const toggleVersion = (v: "humanities" | "sciences") => {
    setVersion((prev) => (prev === v ? "mixed" : v));
  };

  const start = () => {
    if (!canProceed) {
      // 未入力時はリダイレクトせず attempted を立てて未入力欄を赤枠にする。
      setAttempted(true);
      return;
    }
    setStudentInfo({
      grade,
      klass: klass.trim(),
      number: number.trim(),
    });
    // /quiz は学校モードかどうかを localStorage の schoolMode で判別する。
    // 「始める」の挙動は既存ホームと同じく途中保存をクリアする。
    localStorage.setItem("quizVersion", version);
    localStorage.removeItem("quizAnswers");
    localStorage.removeItem("quizCurrentSet");
    sessionStorage.removeItem("quizResult");
    sessionStorage.removeItem("quizResultSent");
    router.push("/quiz");
  };

  const info = COUNT_INFO[version];

  if (!school) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 py-10">
        <p className="text-xs text-gray-400">読み込み中...</p>
      </div>
    );
  }

  // PC版（≥1024px）。状態・ハンドラ・データはモバイルと完全共有し、
  // レイアウトだけ 2 カラムに組み替える（StudentInfoDesktop.jsx 準拠）。
  // 左 = 文理リングプレビュー + 文理トグル / 右 = 選択した学校 + 学年/クラス/出席番号 +
  // 開始ボタン + プライバシー説明。isDesktop が null（マウント前）/ false のときは
  // 下のモバイルJSXを返す。
  if (isDesktop) {
    const fieldBase =
      "h-12 w-full rounded-xl bg-white px-3.5 text-sm text-gray-900 focus:outline-none";
    const borderFor = (empty: boolean) =>
      attempted && empty
        ? "border border-red-400 focus:border-red-500"
        : "border border-gray-200 focus:border-gray-400";
    return (
      <div className="flex min-h-dvh flex-col items-center px-10 py-12">
        <div className="w-full max-w-[820px]">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[11px] tracking-wider text-gray-400">
              STEP 3 / 3
            </p>
            <h1 className="text-2xl font-bold">学年・クラス・出席番号</h1>
          </div>

          <div className="grid grid-cols-2 items-start gap-12">
            {/* 左 — 文理リングプレビュー + トグル */}
            <div className="text-center">
              <div className="flex justify-center">
                <AnimatedRing version={version} size={240} showLabels={false} />
              </div>
              <p className="mb-2 mt-3 text-sm font-medium leading-snug text-gray-800">
                文理が決まっている方はこちら
                <br />
                <span className="text-xs font-normal text-gray-500">
                  （選ばなければ全学科で比較）
                </span>
              </p>
              <div className="mx-auto flex max-w-[320px] gap-2">
                <button
                  onClick={() => toggleVersion("humanities")}
                  className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
                    version === "humanities"
                      ? "border-[#E03767] bg-[#FFEEF1] text-[#B8002F]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-pressed={version === "humanities"}
                >
                  文系
                </button>
                <button
                  onClick={() => toggleVersion("sciences")}
                  className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
                    version === "sciences"
                      ? "border-[#1E40AF] bg-[#E8EFFF] text-[#1E40AF]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-pressed={version === "sciences"}
                >
                  理系
                </button>
              </div>
            </div>

            {/* 右 — 選択した学校 + 入力欄 + 開始 + プライバシー */}
            <div>
              <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="mb-1 text-[10px] text-gray-400">選択した学校</p>
                <p className="text-base font-medium text-gray-800">
                  {school.name}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="grade-pc"
                    className="mb-1.5 block text-xs text-gray-500"
                  >
                    学年
                  </label>
                  <select
                    id="grade-pc"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    aria-invalid={attempted && grade === ""}
                    aria-describedby={
                      attempted && grade === "" ? "grade-pc-err" : undefined
                    }
                    className={`${fieldBase} appearance-none cursor-pointer ${borderFor(
                      grade === "",
                    )}`}
                  >
                    <option value="">選択</option>
                    <option value="中1">中1</option>
                    <option value="中2">中2</option>
                    <option value="中3">中3</option>
                    <option value="高1">高1</option>
                    <option value="高2">高2</option>
                    <option value="高3">高3</option>
                  </select>
                  {attempted && grade === "" && (
                    <p id="grade-pc-err" className="mt-1 text-[10px] text-red-600">
                      未入力
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="klass-pc"
                    className="mb-1.5 block text-xs text-gray-500"
                  >
                    クラス
                  </label>
                  <input
                    id="klass-pc"
                    type="number"
                    inputMode="numeric"
                    value={klass}
                    onChange={(e) => setKlass(e.target.value)}
                    placeholder="3"
                    min={1}
                    max={40}
                    aria-invalid={attempted && klass.trim() === ""}
                    aria-describedby={
                      attempted && klass.trim() === "" ? "klass-pc-err" : undefined
                    }
                    className={`${fieldBase} ${borderFor(klass.trim() === "")}`}
                  />
                  {attempted && klass.trim() === "" && (
                    <p id="klass-pc-err" className="mt-1 text-[10px] text-red-600">
                      未入力
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="number-pc"
                    className="mb-1.5 block text-xs text-gray-500"
                  >
                    出席番号
                  </label>
                  <input
                    id="number-pc"
                    type="number"
                    inputMode="numeric"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="15"
                    min={1}
                    max={50}
                    aria-invalid={attempted && number.trim() === ""}
                    aria-describedby={
                      attempted && number.trim() === ""
                        ? "number-pc-err"
                        : undefined
                    }
                    className={`${fieldBase} ${borderFor(number.trim() === "")}`}
                  />
                  {attempted && number.trim() === "" && (
                    <p
                      id="number-pc-err"
                      className="mt-1 text-[10px] text-red-600"
                    >
                      未入力
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={start}
                className="mt-7 w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                学部診断を始める
              </button>
              {attempted && !canProceed && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  未入力の項目があります（上の「未入力」の欄をご確認ください）
                </p>
              )}

              <p className="mt-3 text-center text-xs text-gray-400">
                {info.count}問・{info.sets}セット・{info.minutes}
              </p>

              <p className="mt-5 text-[11px] leading-relaxed text-gray-500">
                入力した情報は、先生方の進路指導の参考としてのみ利用されます。
                診断結果は学校に共有されますが、個人を特定する情報は
                サイト運営者には共有されません。詳しくは
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-gray-700"
                >
                  プライバシーポリシー
                </Link>
                をご覧ください。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="mb-2 text-[11px] tracking-wider text-gray-400">
            STEP 3 / 3
          </p>
          <h1 className="text-2xl font-bold">学年・クラス・出席番号</h1>
        </div>

        {/* 選択済み学校 */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-1 text-[10px] text-gray-400">選択した学校</p>
          <p className="text-sm font-medium text-gray-800">{school.name}</p>
        </div>

        {/* 学年・クラス・出席番号を3カラムに並べて縦長を抑える。
            幅が狭いので学年表示は「中1」「高3」の短縮形にし、クラス・番号は数字のみ。 */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="grade-m" className="mb-1 block text-xs text-gray-500">
              学年
            </label>
            <select
              id="grade-m"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              aria-invalid={attempted && grade === ""}
              aria-describedby={
                attempted && grade === "" ? "grade-m-err" : undefined
              }
              className={`h-[46px] w-full appearance-none rounded-xl border bg-white px-3 text-sm text-gray-900 focus:outline-none ${
                attempted && grade === ""
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-gray-400"
              }`}
            >
              <option value="">選択</option>
              <option value="中1">中1</option>
              <option value="中2">中2</option>
              <option value="中3">中3</option>
              <option value="高1">高1</option>
              <option value="高2">高2</option>
              <option value="高3">高3</option>
            </select>
            {attempted && grade === "" && (
              <p id="grade-m-err" className="mt-1 text-[10px] text-red-600">
                未入力
              </p>
            )}
          </div>

          <div>
            <label htmlFor="klass-m" className="mb-1 block text-xs text-gray-500">
              クラス
            </label>
            <input
              id="klass-m"
              type="number"
              inputMode="numeric"
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              placeholder="3"
              min={1}
              max={40}
              aria-invalid={attempted && klass.trim() === ""}
              aria-describedby={
                attempted && klass.trim() === "" ? "klass-m-err" : undefined
              }
              className={`h-[46px] w-full rounded-xl border bg-white px-3 text-sm text-gray-900 focus:outline-none ${
                attempted && klass.trim() === ""
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-gray-400"
              }`}
            />
            {attempted && klass.trim() === "" && (
              <p id="klass-m-err" className="mt-1 text-[10px] text-red-600">
                未入力
              </p>
            )}
          </div>

          <div>
            <label htmlFor="number-m" className="mb-1 block text-xs text-gray-500">
              出席番号
            </label>
            <input
              id="number-m"
              type="number"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="15"
              min={1}
              max={50}
              aria-invalid={attempted && number.trim() === ""}
              aria-describedby={
                attempted && number.trim() === "" ? "number-m-err" : undefined
              }
              className={`h-[46px] w-full rounded-xl border bg-white px-3 text-sm text-gray-900 focus:outline-none ${
                attempted && number.trim() === ""
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-gray-400"
              }`}
            />
            {attempted && number.trim() === "" && (
              <p id="number-m-err" className="mt-1 text-[10px] text-red-600">
                未入力
              </p>
            )}
          </div>
        </div>

        {/* 文理選択（ホームと同じ仕様。リングで色変化を見せ、全学科で比較する場合は何も選ばない） */}
        <div className="-my-2 flex justify-center">
          <AnimatedRing version={version} size={140} showLabels={false} />
        </div>
        <p className="mb-2 text-center text-sm font-medium leading-snug text-gray-800">
          文理が決まっている方はこちら
          <br />
          <span className="text-xs font-normal text-gray-500">
            （選ばなければ全学科で比較）
          </span>
        </p>
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => toggleVersion("humanities")}
            className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
              version === "humanities"
                ? "border-[#E03767] bg-[#FFEEF1] text-[#B8002F]"
                : "border-gray-200 text-gray-500 active:bg-gray-50"
            }`}
            aria-pressed={version === "humanities"}
          >
            文系
          </button>
          <button
            onClick={() => toggleVersion("sciences")}
            className={`flex-1 rounded-full border py-2.5 text-sm transition-colors ${
              version === "sciences"
                ? "border-[#1E40AF] bg-[#E8EFFF] text-[#1E40AF]"
                : "border-gray-200 text-gray-500 active:bg-gray-50"
            }`}
            aria-pressed={version === "sciences"}
          >
            理系
          </button>
        </div>

        {/* プライバシー説明 */}
        <p className="mb-6 text-[11px] leading-relaxed text-gray-500">
          入力した情報は、先生方の進路指導の参考としてのみ利用されます。
          診断結果は学校に共有されますが、個人を特定する情報は
          サイト運営者には共有されません。詳しくは
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-gray-700"
          >
            プライバシーポリシー
          </Link>
          をご覧ください。
        </p>

        <button
          onClick={start}
          className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors active:bg-gray-700"
        >
          学部診断を始める
        </button>
        {attempted && !canProceed && (
          <p role="alert" className="mt-2 text-center text-xs text-red-600">
            未入力の項目があります（上の「未入力」の欄をご確認ください）
          </p>
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          {info.count}問・{info.sets}セット・{info.minutes}
        </p>
      </div>
    </div>
  );
}
