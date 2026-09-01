-- =============================================================
-- MIGRACIÓN SEPTIEMBRE 2026 — Colombia Positiva
-- Panel de métricas de redes + importación automática de TikTok
--
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor → Run
--
-- Es aditiva: no borra ni modifica datos existentes. Sin ejecutarla,
-- la web sigue funcionando igual que hoy y el panel de métricas
-- simplemente avisa que falta este paso.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Permisos para el proceso automático (cron)
--
-- El cron no tiene sesión de usuario: entra como `service_role`.
-- Hoy ese rol no tiene privilegios sobre `videos`, así que no puede
-- insertar los videos nuevos de TikTok. Esto se los concede.
-- Las políticas RLS existentes NO se tocan: siguen protegiendo el
-- acceso de los usuarios normales exactamente igual que antes.
-- -------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.videos TO service_role;

-- -------------------------------------------------------------
-- 2. Métricas actuales de cada video publicado en las redes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_videos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform       text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'facebook')),
  external_id    text NOT NULL,               -- id del video dentro de la red
  url            text NOT NULL,
  title          text NOT NULL DEFAULT '',
  thumbnail_url  text,
  published_at   timestamptz,
  views          bigint NOT NULL DEFAULT 0,
  likes          bigint NOT NULL DEFAULT 0,
  comments       bigint NOT NULL DEFAULT 0,
  shares         bigint NOT NULL DEFAULT 0,
  on_site        boolean NOT NULL DEFAULT false,  -- ¿está en Historias de Colombia Positiva?
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE INDEX IF NOT EXISTS social_videos_platform_idx    ON public.social_videos (platform);
CREATE INDEX IF NOT EXISTS social_videos_published_idx   ON public.social_videos (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS social_videos_views_idx       ON public.social_videos (views DESC);

-- -------------------------------------------------------------
-- 3. Foto diaria de cada video → permite ver la evolución
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_video_daily (
  id          bigserial PRIMARY KEY,
  platform    text NOT NULL,
  external_id text NOT NULL,
  day         date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  views       bigint NOT NULL DEFAULT 0,
  likes       bigint NOT NULL DEFAULT 0,
  comments    bigint NOT NULL DEFAULT 0,
  shares      bigint NOT NULL DEFAULT 0,
  UNIQUE (platform, external_id, day)
);

CREATE INDEX IF NOT EXISTS social_video_daily_day_idx ON public.social_video_daily (day DESC);

-- -------------------------------------------------------------
-- 4. Bitácora de cada sincronización (para saber si el cron corre)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_sync_runs (
  id          bigserial PRIMARY KEY,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok          boolean NOT NULL DEFAULT false,
  imported    integer NOT NULL DEFAULT 0,   -- videos nuevos insertados en la web
  updated     integer NOT NULL DEFAULT 0,   -- videos con métricas actualizadas
  detail      jsonb                          -- resumen por red y errores
);

CREATE INDEX IF NOT EXISTS social_sync_runs_started_idx ON public.social_sync_runs (started_at DESC);

-- -------------------------------------------------------------
-- 5. Seguridad: solo los administradores pueden leer las métricas
--
-- El cron escribe con `service_role`, que salta RLS por diseño.
-- Los lectores del sitio NO reciben ningún permiso sobre estas tablas.
-- -------------------------------------------------------------
ALTER TABLE public.social_videos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_video_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_sync_runs  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins leen social_videos" ON public.social_videos;
CREATE POLICY "admins leen social_videos" ON public.social_videos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "admins leen social_video_daily" ON public.social_video_daily;
CREATE POLICY "admins leen social_video_daily" ON public.social_video_daily
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "admins leen social_sync_runs" ON public.social_sync_runs;
CREATE POLICY "admins leen social_sync_runs" ON public.social_sync_runs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

GRANT SELECT ON public.social_videos      TO authenticated;
GRANT SELECT ON public.social_video_daily TO authenticated;
GRANT SELECT ON public.social_sync_runs   TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_videos      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_video_daily TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_sync_runs   TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.social_video_daily_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.social_sync_runs_id_seq   TO service_role;
