import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://ring-map.com";
const SITE_NAME = "ring-map 学部診断";
const SITE_DESCRIPTION =
  "60問の質問に答えて、あなたに合う大学の学科を見つけよう。32学科×19軸のリング型診断で、文理選択と進路の手がかりに。";

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
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-white text-gray-900">{children}</body>
    </html>
  );
}
