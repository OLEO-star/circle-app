"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Ring from "@/components/Ring";
import {
  getSchoolInfo,
  isSchoolMode,
  setStudentInfo,
  type SchoolInfo,
} from "@/lib/school-mode";
import type { Version } from "@/lib/questions";

// ホームと同じプレビュー強度。文理選択でリング色が変わるので、学校モードでも
// 個人モードと同じ視覚的フィードバックを得られる。
const PREVIEW_STRENGTHS = new Array(8).fill(0.7) as number[];

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
            <label className="mb-1 block text-xs text-gray-500">学年</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
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
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">クラス</label>
            <input
              type="number"
              inputMode="numeric"
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              placeholder="3"
              min={1}
              max={40}
              className={`h-[46px] w-full rounded-xl border bg-white px-3 text-sm text-gray-900 focus:outline-none ${
                attempted && klass.trim() === ""
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-gray-400"
              }`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">出席番号</label>
            <input
              type="number"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="15"
              min={1}
              max={50}
              className={`h-[46px] w-full rounded-xl border bg-white px-3 text-sm text-gray-900 focus:outline-none ${
                attempted && number.trim() === ""
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-gray-400"
              }`}
            />
          </div>
        </div>

        {/* 文理選択（ホームと同じ仕様。リングで色変化を見せ、全学科で比較する場合は何も選ばない） */}
        <div className="-my-2 flex justify-center">
          <Ring
            strengths={PREVIEW_STRENGTHS}
            version={version}
            size={140}
            showLabels={false}
          />
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
          <p className="mt-2 text-center text-xs text-red-500">
            未入力の項目があります
          </p>
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          {info.count}問・{info.sets}セット・{info.minutes}
        </p>
      </div>
    </div>
  );
}
