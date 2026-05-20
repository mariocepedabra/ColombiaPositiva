'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Props = {
  value: string
  onChange: (url: string) => void
}

export default function ImageUploader({ value, onChange }: Props) {
  const [mode, setMode] = useState<'url' | 'upload'>(value ? 'url' : 'url')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no puede superar 5 MB')
      return
    }

    setUploading(true)
    setUploadError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(filename, file, { cacheControl: '3600', upsert: false })

    if (error) {
      setUploadError('Error al subir la imagen: ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(data.path)

    onChange(urlData.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      {/* Selector de modo */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
            mode === 'url'
              ? 'bg-verde text-white border-verde'
              : 'border-gris-300 text-gris-600 hover:border-verde'
          }`}
        >
          🔗 URL externa
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
            mode === 'upload'
              ? 'bg-verde text-white border-verde'
              : 'border-gris-300 text-gris-600 hover:border-verde'
          }`}
        >
          📁 Subir imagen
        </button>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full border border-gris-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-verde"
        />
      ) : (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gris-300 hover:border-verde cursor-pointer p-6 text-center transition-colors"
          >
            {uploading ? (
              <p className="font-sans text-sm text-gris-600">Subiendo imagen...</p>
            ) : (
              <>
                <p className="font-sans text-sm text-gris-600 mb-1">
                  Haz clic para seleccionar una imagen
                </p>
                <p className="font-sans text-xs text-gris-400">
                  JPG, PNG, WEBP · Máx 5 MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadError && (
            <p className="font-sans text-xs text-red-600 mt-1">{uploadError}</p>
          )}
          {value && mode === 'upload' && (
            <p className="font-sans text-xs text-verde mt-1">✓ Imagen subida correctamente</p>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-3 relative overflow-hidden bg-gris-100" style={{ height: 140 }}>
          <Image
            src={value}
            alt="Vista previa"
            fill
            className="object-cover"
            unoptimized={value.includes('picsum')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-[#006138]/60 text-white text-xs px-2 py-1 hover:bg-[#006138]/80"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  )
}
