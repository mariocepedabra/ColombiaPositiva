-- =============================================================
-- MIGRACIÓN JUNIO 2026 — Colombia Positiva
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor
--
-- 1) Permite la nueva categoría 'educacion' en los artículos.
--    (Los nombres visibles Emprendimiento y Turismo conservan los
--    slugs 'economia' y 'medio-ambiente'; no requieren cambios.)
-- 2) Permite los valores 'instagram' y 'facebook' en videos.platform.
--    El código funciona sin esto (clasifica por URL con fallback),
--    pero así la columna queda con el valor correcto.
-- =============================================================

-- 1. Artículos: agregar 'educacion' a las categorías permitidas
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_category_slug_check;
ALTER TABLE public.articles ADD CONSTRAINT articles_category_slug_check CHECK (
  category_slug IN (
    'economia', 'medio-ambiente', 'cultura', 'deporte',
    'ciencia', 'regiones', 'personajes', 'educacion'
  )
);

-- 2. Videos: permitir las plataformas Instagram y Facebook
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_platform_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_platform_check CHECK (
  platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'direct')
);
