-- =============================================================
-- MIGRACIÓN SEPTIEMBRE 2026 — Colombia Positiva
-- Impresiones y clics de la pauta (app móvil) → panel de pautas
--
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor → Run
--
-- Es ADITIVA: no toca ad_submissions ni nada existente. Sin ejecutarla, la
-- app sigue funcionando (los eventos se descartan) y el panel no muestra
-- cifras.
--
-- Qué guarda: por anuncio, día, zona y plataforma, cuántas veces se mostró y
-- cuántas se tocó. Conteos agregados; nunca quién lo vio.
-- =============================================================

-- 1. Conteos diarios
CREATE TABLE IF NOT EXISTS public.ad_stats_daily (
  ad_id       UUID NOT NULL REFERENCES public.ad_submissions(id) ON DELETE CASCADE,
  day         DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  zone        TEXT NOT NULL DEFAULT '',
  platform    TEXT NOT NULL DEFAULT 'app',
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ad_id, day, zone, platform)
);

CREATE INDEX IF NOT EXISTS ad_stats_daily_day_idx ON public.ad_stats_daily (day DESC);

-- 2. Sumar un lote (la llama /api/app/pauta/eventos con service role).
--    Ignora anuncios que no existen: no se puede inflar nada inventando ids.
CREATE OR REPLACE FUNCTION public.record_ad_events(
  p_ad_id       UUID,
  p_zone        TEXT,
  p_platform    TEXT,
  p_impressions INTEGER,
  p_clicks      INTEGER
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.ad_stats_daily (ad_id, day, zone, platform, impressions, clicks)
  SELECT p_ad_id, (now() AT TIME ZONE 'America/Bogota')::date, COALESCE(p_zone, ''), COALESCE(p_platform, 'app'),
         GREATEST(0, p_impressions), GREATEST(0, p_clicks)
  WHERE EXISTS (SELECT 1 FROM public.ad_submissions a WHERE a.id = p_ad_id)
  ON CONFLICT (ad_id, day, zone, platform) DO UPDATE
    SET impressions = ad_stats_daily.impressions + EXCLUDED.impressions,
        clicks      = ad_stats_daily.clicks + EXCLUDED.clicks;
$$;

-- 3. Totales por anuncio (para el panel), con los últimos 7 días aparte.
CREATE OR REPLACE VIEW public.ad_stats_totals AS
  SELECT
    ad_id,
    SUM(impressions)::bigint AS impressions,
    SUM(clicks)::bigint      AS clicks,
    SUM(impressions) FILTER (WHERE day >= (now() AT TIME ZONE 'America/Bogota')::date - 6)::bigint AS impressions_7d,
    SUM(clicks)      FILTER (WHERE day >= (now() AT TIME ZONE 'America/Bogota')::date - 6)::bigint AS clicks_7d,
    MAX(day) AS last_day
  FROM public.ad_stats_daily
  GROUP BY ad_id;

-- 4. Permisos: escribe el servidor; leen los administradores (panel).
ALTER TABLE public.ad_stats_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins leen ad_stats_daily" ON public.ad_stats_daily;
CREATE POLICY "admins leen ad_stats_daily" ON public.ad_stats_daily
  FOR SELECT TO authenticated USING (public.is_admin());

GRANT SELECT ON public.ad_stats_daily TO authenticated;
GRANT SELECT ON public.ad_stats_totals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_stats_daily TO service_role;
GRANT EXECUTE ON FUNCTION public.record_ad_events(UUID, TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- Comprobación: debe devolver una tabla vacía sin error.
SELECT * FROM public.ad_stats_totals;
