import type { Metadata } from "next";

// /start = 個人で学部診断を受ける入口。page.tsx は client のため metadata はここ
// （server layout）で出す。固有タイトル＋自己 canonical でホームとの重複を解消する。
export const metadata: Metadata = {
  title: "学部診断を受ける（個人向け）",
  description:
    "中高生向けの無料の学部・学科診断。約45〜66問・22軸・36学科のリング型診断で、文理選択と進路選びの手がかりに。",
  alternates: { canonical: "/start" },
  openGraph: {
    title: "学部診断を受ける（個人向け） | ring-map 学部診断",
    description:
      "中高生向けの無料の学部・学科診断。約45〜66問・22軸・36学科で、文理選択と進路選びの手がかりに。",
    url: "https://ring-map.com/start",
    type: "website",
    locale: "ja_JP",
  },
};

export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
