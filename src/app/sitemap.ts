import type { MetadataRoute } from "next";

const SITE_URL = "https://ring-map.com";

// output: "export"（静的エクスポート）では、ビルド時に sitemap.xml を
// 完全な静的ファイルとして書き出すために force-static を明示する必要がある。
export const dynamic = "force-static";

// インデックスさせる公開ページのみを列挙する。
// /schools 配下は JSON データ、/result は診断後の状態ページのため除外。
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes: Array<{
    path: string;
    changeFrequency: "yearly" | "monthly" | "weekly";
    priority: number;
  }> = [
    // / は先生向け玄関（2026-06 刷新）。/start＝個人診断の入口（旧トップの中身を移設）。
    // 生徒の学校配布入口は /s。学生向け「学部診断」の実体ページは /start と /s。
    { path: "", changeFrequency: "monthly", priority: 1 },
    { path: "/start", changeFrequency: "monthly", priority: 0.9 },
    { path: "/s", changeFrequency: "monthly", priority: 0.9 },
    { path: "/quiz", changeFrequency: "monthly", priority: 0.7 },
    { path: "/teachers", changeFrequency: "monthly", priority: 0.7 },
    { path: "/en", changeFrequency: "yearly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
