import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://ring-map.com";
const SITE_NAME = "ring-map 学部診断";
const SITE_DESCRIPTION =
  "約45〜66問（学部選択により異なる）の質問に答えて、あなたに合う大学の学科を見つけよう。36学科×22軸のリング型診断で、文理選択と進路の手がかりに。";

// 構造化データ（JSON-LD）。Organization = ブランド/運営主体のエンティティ、
// WebSite = サイト名の宣言。先生が「ring-map」で検索したとき、Google が
// サイト名・運営主体を正しく認識できるようにする（B2B 信頼性の土台）。
// FAQPage は Google が 2023 年に政府/医療系以外でリッチリザルトを廃止したため不採用。
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ring-map",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      email: "info@ring-map.com",
      description:
        "中高生の文理選択・進路選びを支援する学部診断サービス。大学の学科を興味・適性の22軸で可視化する。",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ja",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "学部診断 | ring-map",
    template: "%s | ring-map",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "ring-map" }],
  keywords: [
    "学部診断",
    "進路診断",
    "文理選択",
    "大学",
    "学部",
    "高校生",
    "中学生",
    "進路指導",
    "ring-map",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "学部診断 | ring-map",
    description: SITE_DESCRIPTION,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "学部診断 | ring-map",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    // 自己参照 canonical（ホームページ）。サブページは各自のレイアウト/ページで
    // 自分のパスを canonical に設定する（ルートの絶対URLを継承させない＝P1修正）。
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-white text-gray-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        {children}
      </body>
    </html>
  );
}
