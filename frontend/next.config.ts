import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 호환 설정
  output: "standalone",

  // 이미지 최적화 설정 (Cloudflare 호환)
  images: {
    unoptimized: true,
  },

  // 환경변수 노출 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
