'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { IMAGEN_RESPALDO } from '@/lib/imagenes'

// Imagen de una nota. Si la foto original no carga (borrada en el origen, red
// caída, formato roto) se cambia por la portada genérica de Colombia Positiva:
// en un periódico nunca debe quedar el ícono de imagen rota.

type Props = Omit<ImageProps, 'src' | 'onError'> & { src: string | null | undefined }

export default function ArticleImage({ src, alt, ...rest }: Props) {
  // Se guarda la URL que falló (no un booleano) para que el respaldo se
  // reinicie solo cuando el componente pasa a mostrar otra nota.
  const [urlFallida, setUrlFallida] = useState<string | null>(null)

  const original = src || null
  const usada = !original || urlFallida === original ? IMAGEN_RESPALDO : original

  return (
    <Image
      {...rest}
      src={usada}
      alt={alt}
      // La portada genérica es un archivo local: no hay nada que redimensionar.
      unoptimized={usada === IMAGEN_RESPALDO}
      onError={() => original && setUrlFallida(original)}
    />
  )
}
