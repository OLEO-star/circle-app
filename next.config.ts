import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev server を LAN/トンネル経由のスマホ等から開くとき、Next.js のオリジン
  // チェックで JS バンドル/HMR がブロックされるのを許可するための設定。
  allowedDevOrigins: [
    "192.168.0.12",
    "192.168.0.0/24",
    "*.loca.lt",
  ],
};

export default nextConfig;
