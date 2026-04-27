"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Ring from "@/components/Ring";
import type { Version } from "@/lib/questions";

const PREVIEW_STRENGTHS = new Array(8).fill(0.7) as number[];

// 開始前の見通し：セット数も見せて「分割されている＝細切れに進められる」と
// 認知させると、心理的負荷が下がり開始率が上がる（goal-gradient effect）。
const COUNT_INFO: Record<
  Version,
  { count: number; minutes: string; sets: number }
> = {
  mixed: { count: 61, minutes: "約10分", sets: 6 },
  humanities: { count: 47, minutes: "約8分", sets: 5 },
  sciences: { count: 50, minutes: "約8分", sets: 5 },
};

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<Version>("mixed");

  const toggle = (v: "humanities" | "sciences") => {
    setSelected((prev) => (prev === v ? "mixed" : v));
  };

  const start = () => {
    // 「始める」は明示的な新規開始 → 途中保存をクリアして fresh start
    localStorage.setItem("quizVersion", selected);
    localStorage.removeItem("quizAnswers");
    localStorage.removeItem("quizCurrentSet");
    sessionStorage.removeItem("quizResult");
    router.push("/quiz");
  };

  const info = COUNT_INFO[selected];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <Ring
          strengths={PREVIEW_STRENGTHS}
          version={selected}
          size={200}
          showLabels={false}
        />

        <h1 className="mb-3 mt-4 text-2xl font-bold">学部診断</h1>
        <p className="mb-7 text-sm leading-relaxed text-gray-500">
          質問に答えて
          <br />
          あなたに合う大学の学科を見つけよう
        </p>

        <p className="mb-2 text-[11px] leading-relaxed text-gray-400">
          文理が決まっている方はこちら（選ばなければ全学科で比較）
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
      </div>
    </div>
  );
}
