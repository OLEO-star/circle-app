"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedRing from "@/components/AnimatedRing";
import { clearSchoolMode, enableSchoolMode } from "@/lib/school-mode";

export default function SchoolEntryPage() {
  const router = useRouter();

  // PC版（≥1024px / lg）かどうか。SSR とクライアント初回で同じ DOM を返すため
  // null 初期化し、マウント後に matchMedia を評価して確定する（result-v と同じ流儀）。
  // null の間はモバイルJSXを返す（SSRはモバイル前提）→ マウント後に PC幅なら切替。
  // CSS の hidden/lg:block 二枚出しだと Ring の canvas が二重生成されるため、
  // JSレベルで片方だけをレンダーする方式にする。
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const start = () => {
    // /s から入ったセッションだけ schoolMode を true にする。
    // 個人モード（/）と分岐させ、診断完了時の送信先をここで決定する。
    enableSchoolMode();
    router.push("/s/select");
  };

  const goPersonal = () => {
    // 個人モードに戻る生徒のため、誤って残った schoolMode を念のため掃除する。
    clearSchoolMode();
    router.push("/");
  };

  // PC版（≥1024px）。状態・ハンドラはモバイルと完全共有し、レイアウトだけ
  // 横型 split に組み替える（SchoolEntryDesktop.jsx 準拠）。
  // isDesktop が null（マウント前）/ false のときは下のモバイルJSXを返す。
  if (isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-10 py-12">
        <div className="flex max-w-[820px] items-center gap-16">
          <AnimatedRing version="mixed" size={240} showLabels={false} />

          {/* 縦罫線（リングと右カラムを視覚的に分離） */}
          <div className="w-px self-stretch bg-gray-200" />

          <div className="w-[380px]">
            <h1 className="text-2xl font-bold">学部診断</h1>
            <p className="mb-5 mt-3 text-sm leading-relaxed text-gray-500">
              質問に答えて、あなたに合う大学の学科を見つけよう。
            </p>

            {/* 学校配布向けセクション（四角枠で囲って役割を視覚的に分離） */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs leading-relaxed text-gray-500">
                先生から案内された方は、下の学校情報の入力に進んでください。
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                入力した情報は先生方の進路指導の参考のためにのみ使われます。
              </p>
            </div>

            <button
              onClick={start}
              className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 active:bg-gray-700"
            >
              学校情報の入力に進む
            </button>

            <button
              onClick={goPersonal}
              className="mt-3 w-full rounded-full border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-50"
            >
              個人で診断する
            </button>
          </div>
        </div>

        <div className="mt-11 flex justify-center gap-5 text-[10px] text-gray-400">
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

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <AnimatedRing version="mixed" size={200} showLabels={false} />

        {/* サイトのアイデンティティ（ホームと同じトーン） */}
        <h1 className="mb-3 mt-4 text-2xl font-bold">学部診断</h1>
        <p className="mb-4 text-sm leading-relaxed text-gray-500">
          質問に答えて
          <br />
          あなたに合う大学の学科を見つけよう
        </p>

        {/* 学校配布向けセクション（四角枠で囲って役割を視覚的に分離） */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-xs leading-relaxed text-gray-500">
            先生から案内された方は、
            <br />
            下の学校情報の入力に進んでください。
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
            入力した情報は先生方の進路指導の参考のためにのみ使われます。
          </p>
        </div>

        <button
          onClick={start}
          className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors active:bg-gray-700"
        >
          学校情報の入力に進む
        </button>

        <button
          onClick={goPersonal}
          className="mt-3 w-full rounded-full border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-50"
        >
          個人で診断する
        </button>

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
