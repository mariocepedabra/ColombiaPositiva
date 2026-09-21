-- =============================================================
-- MIGRACIÓN SEPTIEMBRE 2026 — Colombia Positiva
-- Vistas diarias por nota → "las más leídas de la semana" (web y app)
--
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor → Run
--
-- Es ADITIVA: no toca articles.view_count ni nada existente. Sin ejecutarla,
-- todo sigue igual que hoy: la app muestra el top acumulado (view_count) y
-- pasa al ranking semanal sola en cuanto la tabla tenga datos.
--
-- Qué guarda: por cada nota y cada día, cuántas veces se abrió. No guarda
-- quién la abrió ni desde dónde: son conteos, no personas.
-- =============================================================

-- 1. Tabla de conteos diarios
CREATE TABLE IF NOT EXISTS public.article_views_daily (
  slug  TEXT NOT NULL,
  day   DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, day)
);

CREATE INDEX IF NOT EXISTS article_views_daily_day_idx ON public.article_views_daily (day DESC);

-- 2. Sumar una vista al día de hoy (la llama /api/articles/[slug]/view junto
--    con increment_view_count, con service role)
CREATE OR REPLACE FUNCTION public.increment_daily_view(article_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.article_views_daily (slug, day, views)
  VALUES (article_slug, (now() AT TIME ZONE 'America/Bogota')::date, 1)
  ON CONFLICT (slug, day) DO UPDATE SET views = article_views_daily.views + 1;
$$;

-- 3. Las notas más leídas de los últimos N días (por defecto 7), con los
--    mismos campos que search_articles_fuzzy para reutilizar el normalizador
CREATE OR REPLACE FUNCTION public.top_articles_week(
  result_limit INT DEFAULT 10,
  days_back    INT DEFAULT 7
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
  read_time     INTEGER,
  week_views    BIGINT
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    a.id, a.title, a.slug, a.excerpt, a.category_slug, a.image_url,
    a.author_name, a.published_at, a.read_time,
    SUM(v.views) AS week_views
  FROM public.article_views_daily v
  JOIN public.articles a ON a.slug = v.slug AND a.is_published = true
  WHERE v.day >= ((now() AT TIME ZONE 'America/Bogota')::date - (days_back - 1))
  GROUP BY a.id
  ORDER BY week_views DESC, a.published_at DESC
  LIMIT result_limit;
$$;

-- 4. Permisos. Los conteos son públicos (no identifican a nadie); solo el
--    servidor (service_role) escribe.
ALTER TABLE public.article_views_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conteos diarios son públicos" ON public.article_views_daily;
CREATE POLICY "conteos diarios son públicos"
  ON public.article_views_daily FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.article_views_daily TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_views_daily TO service_role;

GRANT EXECUTE ON FUNCTION public.increment_daily_view(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.top_articles_week(INT, INT) TO anon, authenticated, service_role;

-- Comprobación: debe devolver una fila vacía (aún sin datos) sin error.
SELECT * FROM public.top_articles_week(10);
