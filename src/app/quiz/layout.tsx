import type { Metadata } from "next";

// /quiz = 診断の質問フロー（client・回答状態に依存）。metadata はここで出す。
// 固有タイトル＋自己 canonical でホームとの重複を解消する。
export const metadata: Metadata = {
  title: "学部診断の質問に答える",
  description:
    "ring-map 学部診断の質問ページ。約45〜66問・5段階リッカートで、興味（好き）と耐性（覚悟）の2タイプから学科適性を測ります。",
  alternates: { canonical: "/quiz" },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
