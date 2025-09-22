import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.escortforumit.xxx',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    // Temporarily ignore ESLint errors during production builds while we refactor types
    ignoreDuringBuilds: true,
  },
  // Forza le API routes a essere case-sensitive
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/API/:path*',
        destination: '/api/:path*',
      },
    ]
  },
};

export default nextConfig;
