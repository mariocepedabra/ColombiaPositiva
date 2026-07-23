import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Optimizador propio (/api/imagen) en lugar de /_next/image: el de Vercel
    // se quedó sin cuota de transformaciones y respondía 402, con lo que las
    // notas cuya variante no estaba en caché se quedaban sin foto.
    // Los dominios permitidos se validan en lib/imagenes.ts.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
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
