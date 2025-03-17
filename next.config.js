/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'codkkdtxilrcepekyycr.supabase.co',
      },
    ],
  },
  // Vercel性能优化
  experimental: {
    webpackBuildWorker: true,
  },
  // 生产环境配置
  productionBrowserSourceMaps: false,
  swcMinify: true,
}

module.exports = nextConfig 