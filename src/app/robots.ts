import type { MetadataRoute } from "next";

const SITE_URL = "https://ring-map.com";

// output: "export"（静的エクスポート）では robots.txt をビルド時に静的生成するため
// force-static を明示する。
export const dynamic = "force-static";

// 公開ページはクロール許可。診断後の状態ページ /result と検証用デモ /result-v は
// 実コンテンツを持たない（sessionStorage 依存）ためクロール対象から除外する。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/result", "/result-v", "/ring-lab"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
