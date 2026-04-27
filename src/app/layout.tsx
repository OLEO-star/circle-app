import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学部診断",
  description: "60問の質問に答えて、あなたに合う大学の学科を見つけよう",
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
