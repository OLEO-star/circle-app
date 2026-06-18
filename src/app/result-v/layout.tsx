import type { Metadata } from "next";

// /result-v は本番採用前の検証用デモルート（導線なし・URL直叩きのみ）。
// 公開はされるが検索インデックスはさせない（noindex,nofollow）。
// page.tsx は "use client" のため metadata を持てないので、この server layout で付与する。
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ResultVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
