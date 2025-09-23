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
  typescript: {
    // Ignora errori TypeScript durante il build per velocizzare il deploy
    ignoreBuildErrors: true,
  },
  // Configurazione per evitare problemi Edge Runtime
  serverExternalPackages: ['jsonwebtoken', 'bcryptjs'],
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
  async redirects() {
    return [
      // Root of old flow -> nuova landing Compila (contatti)
      { source: '/dashboard/mio-profilo', destination: '/dashboard/escort/compila/contatti', permanent: false },
      { source: '/dashboard/mio-profilo/', destination: '/dashboard/escort/compila/contatti', permanent: false },

      // Sezioni specifiche -> nuove sezioni
      { source: '/dashboard/mio-profilo/contatti', destination: '/dashboard/escort/compila/contatti', permanent: false },
      { source: '/dashboard/mio-profilo/biografia', destination: '/dashboard/escort/compila/biografia', permanent: false },
      { source: '/dashboard/mio-profilo/lingue', destination: '/dashboard/escort/compila/lingue', permanent: false },
      { source: '/dashboard/mio-profilo/citta-di-lavoro', destination: '/dashboard/escort/compila/citta-di-lavoro', permanent: false },
      { source: '/dashboard/mio-profilo/servizi', destination: '/dashboard/escort/compila/servizi', permanent: false },
      { source: '/dashboard/mio-profilo/orari', destination: '/dashboard/escort/compila/orari', permanent: false },
      { source: '/dashboard/mio-profilo/tariffe', destination: '/dashboard/escort/compila/tariffe', permanent: false },
      { source: '/dashboard/mio-profilo/foto-naturale', destination: '/dashboard/escort/compila/contatti', permanent: false },
    ]
  },
};

export default nextConfig;
