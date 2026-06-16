-- =============================================================
-- MIGRACIÓN JUNIO 2026 — Colombia Positiva
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor
--
-- Mejora el buscador para encontrar resultados similares aunque
-- el usuario escriba palabras con errores ortográficos o variantes.
-- Usa la extensión pg_trgm (trigramas) de PostgreSQL.
--
-- Ejemplo: buscar "Juann" encuentra artículos sobre "Juan".
-- =============================================================

-- 1. Activar extensión de trigramas (ya incluida en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índices GIN para que las búsquedas de similitud sean rápidas
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
  ON public.articles USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_articles_excerpt_trgm
  ON public.articles USING gin(excerpt gin_trgm_ops);

-- 3. Función de búsqueda fuzzy
--    Orden de prioridad:
--      (1) La palabra buscada aparece literalmente en el título
--      (2) La palabra buscada aparece literalmente en el excerpt o contenido
--      (3) Palabras similares por trigramas (mayor similitud primero)
--      (4) Más reciente primero como desempate
CREATE OR REPLACE FUNCTION public.search_articles_fuzzy(
  search_query  TEXT,
  result_limit  INT DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  title         TEXT,
  slug          TEXT,
  excerpt       TEXT,
  category_slug TEXT,
  image_url     TEXT,
  author_name   TEXT,
  published_at  TIMESTAMPTZ,
  read_time     INTEGER
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.category_slug,
    a.image_url,
    a.author_name,
    a.published_at,
    a.read_time
  FROM public.articles a
  WHERE
    a.is_published = true
    AND (
      -- Coincidencia exacta parcial (comportamiento actual)
      a.title   ILIKE '%' || search_query || '%'
      OR a.excerpt ILIKE '%' || search_query || '%'
      OR a.content ILIKE '%' || search_query || '%'
      -- Similitud por trigramas: captura errores ortográficos y variantes
      OR word_similarity(search_query, a.title)   > 0.2
      OR word_similarity(search_query, a.excerpt) > 0.2
    )
  ORDER BY
    CASE WHEN a.title ILIKE '%' || search_query || '%' THEN 0 ELSE 1 END ASC,
    CASE WHEN a.excerpt ILIKE '%' || search_query || '%'
           OR a.content  ILIKE '%' || search_query || '%'
         THEN 0 ELSE 1 END ASC,
    GREATEST(
      word_similarity(search_query, a.title),
      word_similarity(search_query, a.excerpt)
    ) DESC,
    a.published_at DESC
  LIMIT result_limit;
$$;

-- Permitir que usuarios anónimos llamen la función
GRANT EXECUTE ON FUNCTION public.search_articles_fuzzy(TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.search_articles_fuzzy(TEXT, INT) TO authenticated;
