import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 等の静的ホスティングへデプロイするため、static export を有効化。
  // out/ ディレクトリに完全な静的サイトが生成される。
  // 前提: 動的 route なし / API Route なし / Image Optimization 未使用 / middleware なし。
  output: "export",
  // dev server を LAN/トンネル経由のスマホ等から開くとき、Next.js のオリジン
  // チェックで JS バンドル/HMR がブロックされるのを許可するための設定。
  allowedDevOrigins: [
    "192.168.0.12",
    "192.168.0.0/24",
    "*.loca.lt",
  ],
};

export default nextConfig;
