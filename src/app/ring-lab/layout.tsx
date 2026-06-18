import type { Metadata } from "next";

// /ring-lab は mix リング調整用の開発ツール（導線なし）。検索インデックスさせない。
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RingLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
