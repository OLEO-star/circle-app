import type { Metadata } from "next";

// /s = 学校配布モードの入口（配布QR/学校コード）。配下の /s/info・/s/select も
// このメタデータを継承する（学校モードの文脈として妥当）。固有タイトル＋自己 canonical。
export const metadata: Metadata = {
  title: "学校で受ける学部診断（学校コード入力）",
  description:
    "学校から配布されたコードを入力して受ける学部診断。回答は御校所有のスプレッドシートに集計され、運営側のマスタには個人を特定できる情報を残しません。",
  alternates: { canonical: "/s" },
  openGraph: {
    title: "学校で受ける学部診断 | ring-map 学部診断",
    description:
      "学校から配布されたコードを入力して受ける学部診断。回答は御校所有のスプレッドシートに集計されます。",
    url: "https://ring-map.com/s",
    type: "website",
    locale: "ja_JP",
  },
};

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
