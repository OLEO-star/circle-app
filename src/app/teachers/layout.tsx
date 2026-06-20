// /teachers の metadata はここ（server layout）で出す。
// page.tsx は matchMedia で PC版/スマホ版を出し分けるため "use client" 化しており、
// client コンポーネントからは metadata を export できない。値の単一ソースは
// teachers-content.tsx（DesktopとMobileも同じコンテンツを参照）。
export { metadata } from "./teachers-content";

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
