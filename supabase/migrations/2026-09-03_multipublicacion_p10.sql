-- ============================================================================
--  2026-09-03_multipublicacion_p10.sql
--  Enlace con las notas publicadas desde Página 10 (plugin p10-multipublicacion)
-- ----------------------------------------------------------------------------
--  Migración ADITIVA: solo añade dos columnas opcionales a `articles`. Las
--  filas existentes quedan con NULL y nada del sitio cambia. No toca RLS ni el
--  constraint de categorías.
--
--    p10_post_id → ID de la entrada en el WordPress de Página 10. Es la llave
--                  que permite que editar la nota allí actualice ESTA fila en
--                  vez de crear un duplicado.
--    p10_url     → permalink original. Se usa para la etiqueta canónica y para
--                  el crédito «Publicado originalmente en Página 10».
--
--  Ejecutar en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS p10_post_id BIGINT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS p10_url TEXT;

-- Índice único parcial: dos notas distintas no pueden venir de la misma
-- entrada de Página 10, pero sí puede haber muchas notas propias sin origen.
CREATE UNIQUE INDEX IF NOT EXISTS articles_p10_post_id_key
  ON public.articles (p10_post_id)
  WHERE p10_post_id IS NOT NULL;

-- Búsqueda rápida de las notas sindicadas.
CREATE INDEX IF NOT EXISTS articles_p10_url_idx
  ON public.articles (p10_url)
  WHERE p10_url IS NOT NULL;
