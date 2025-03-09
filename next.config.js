/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'codkkdtxilrcepekyycr.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig 