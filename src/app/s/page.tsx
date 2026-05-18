"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Ring from "@/components/Ring";
import { clearSchoolMode, enableSchoolMode } from "@/lib/school-mode";

// ホームと同じプレビュー強度。トーンを揃え、入口で安心感を出す。
const PREVIEW_STRENGTHS = new Array(8).fill(0.7) as number[];

export default function SchoolEntryPage() {
  const router = useRouter();

  const start = () => {
    // /s から入ったセッションだけ schoolMode を true にする。
    // 個人モード（/）と分岐させ、診断完了時の送信先をここで決定する。
    enableSchoolMode();
    router.push("/s/select");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <Ring
          strengths={PREVIEW_STRENGTHS}
          version="mixed"
          size={200}
          showLabels={false}
        />

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
          onClick={() => {
            // 個人モードに戻る生徒のため、誤って残った schoolMode を念のため掃除する。
            clearSchoolMode();
            router.push("/");
          }}
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
