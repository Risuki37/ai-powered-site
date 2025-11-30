/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 圧縮設定
  compress: true,
  // 画像最適化設定
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
    // 画像形式の最適化
    formats: ['image/avif', 'image/webp'],
    // デバイスサイズの最適化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 最小化された画像を優先
    minimumCacheTTL: 60,
  },
  // 実験的機能
  experimental: {
    // App Routerを使用
  },
}

module.exports = nextConfig

