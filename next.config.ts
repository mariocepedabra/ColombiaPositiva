import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'hyyjxeafxccrbkxgnmcz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'pagina10.com',
      },
    ],
  },
  async redirects() {
    return [
      // Forzar HTTPS en producción
      {
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://colombiapositiva.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
