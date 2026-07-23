import type { NextConfig } from 'next'
import { ANCHOS_DISPOSITIVO, ANCHOS_MINIATURA } from './lib/imagenes'

const nextConfig: NextConfig = {
  images: {
    // Optimizador propio (/api/imagen) en lugar de /_next/image: el de Vercel
    // se quedó sin cuota de transformaciones y respondía 402, con lo que las
    // notas cuya variante no estaba en caché se quedaban sin foto.
    // Los dominios permitidos se validan en lib/imagenes.ts.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    // Menos anchos que los de serie: cada uno es una redimensión que gasta
    // CPU de función, y el plan de Vercel tiene tope.
    deviceSizes: ANCHOS_DISPOSITIVO,
    imageSizes: ANCHOS_MINIATURA,
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
