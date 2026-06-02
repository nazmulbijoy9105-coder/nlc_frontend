import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://nlc-platform.onrender.com/:path*',
      },
    ]
  },
}

export default nextConfig
