"use client";

import { useEffect, useState } from "react";
import TeachersDesktop from "./TeachersDesktop";
import TeachersMobile from "./TeachersMobile";

// /teachers は PC版（TeachersDesktop）とスマホ版（TeachersMobile）でUIを分離している。
// 他ページ（home/result/quiz/s 系）と同じ流儀で、matchMedia(1024px)で出し分ける。
//   - SSR とクライアント初回で同じ DOM を返すため isDesktop は null 初期化（モバイルを既定）。
//   - details の開閉状態など二重生成を避けるため JS で片方だけレンダーする。
// 文言の単一ソースは teachers-content.tsx（Desktop/Mobile が共に参照）。metadata は layout.tsx。
export default function TeachersPage() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop ? <TeachersDesktop /> : <TeachersMobile />;
}
