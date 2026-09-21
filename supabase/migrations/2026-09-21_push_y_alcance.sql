-- =============================================================
-- MIGRACIÓN SEPTIEMBRE 2026 — Colombia Positiva
-- App móvil: tokens de notificaciones push + estadística anónima de lectura
--
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor → Run
--
-- Es ADITIVA: no toca nada existente. Sin ejecutarla, la app funciona igual;
-- solo no se guardan tokens ni eventos y el panel de alcance avisa.
--
-- PRIVACIDAD (léase antes de tocar esto):
--  · push_tokens guarda el token técnico del dispositivo que entrega Apple/
--    Google vía Expo. No se asocia a ninguna cuenta de usuario.
--  · app_events guarda QUÉ se leyó (nota o sección), cuándo, en qué
--    plataforma, en qué ciudad aproximada y un código de sesión al azar que
--    la app renueva cada día. NUNCA el usuario, ni la IP, ni identificadores
--    del teléfono. Sirve para vender ALCANCE («lectores de Deporte en Pasto»),
--    no datos de personas.
-- =============================================================

-- 1. Tokens push -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_tokens (
  token       TEXT PRIMARY KEY,                       -- ExponentPushToken[…]
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error  TEXT
);

CREATE INDEX IF NOT EXISTS push_tokens_active_idx ON public.push_tokens (active) WHERE active;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
-- Nadie lee ni escribe tokens desde el cliente: solo el servidor (service_role).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO service_role;

-- 2. Eventos anónimos de lectura ------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_events (
  id          BIGSERIAL PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('portada', 'nota', 'seccion', 'video', 'busqueda')),
  slug        TEXT,                                   -- nota o video
  section     TEXT,                                   -- slug de sección
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  session     TEXT NOT NULL,                          -- código al azar diario
  city        TEXT,
  region      TEXT,
  country     TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Día y hora en Colombia, ya calculados para agrupar rápido
  day         DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  hour        SMALLINT NOT NULL DEFAULT EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Bogota')::smallint
);

CREATE INDEX IF NOT EXISTS app_events_day_idx     ON public.app_events (day DESC);
CREATE INDEX IF NOT EXISTS app_events_section_idx ON public.app_events (section, day);
CREATE INDEX IF NOT EXISTS app_events_city_idx    ON public.app_events (city, day);

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins leen app_events" ON public.app_events;
CREATE POLICY "admins leen app_events" ON public.app_events
  FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.app_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.app_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.app_events_id_seq TO service_role;

-- 3. Resumen para el panel de alcance (una llamada, todo agregado) ---------
CREATE OR REPLACE FUNCTION public.alcance_resumen(p_desde DATE, p_hasta DATE)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH e AS (
    SELECT * FROM public.app_events
    WHERE day BETWEEN p_desde AND p_hasta
  ),
  lecturas AS (SELECT * FROM e WHERE type IN ('nota', 'seccion'))
  SELECT jsonb_build_object(
    'totales', (SELECT jsonb_build_object(
        'eventos',  count(*),
        'lecturas', (SELECT count(*) FROM lecturas),
        'sesiones', count(DISTINCT session),
        'ciudades', count(DISTINCT city) FILTER (WHERE city IS NOT NULL)
      ) FROM e),
    'porPlataforma', (SELECT COALESCE(jsonb_agg(jsonb_build_object('plataforma', platform, 'lecturas', n) ORDER BY n DESC), '[]'::jsonb)
      FROM (SELECT platform, count(*) n FROM lecturas GROUP BY platform) t),
    'porSeccion', (SELECT COALESCE(jsonb_agg(jsonb_build_object('seccion', section, 'lecturas', n, 'sesiones', s) ORDER BY n DESC), '[]'::jsonb)
      FROM (SELECT section, count(*) n, count(DISTINCT session) s FROM lecturas WHERE section IS NOT NULL GROUP BY section) t),
    'porCiudad', (SELECT COALESCE(jsonb_agg(jsonb_build_object('ciudad', city, 'region', region, 'lecturas', n, 'sesiones', s) ORDER BY n DESC), '[]'::jsonb)
      FROM (SELECT city, region, count(*) n, count(DISTINCT session) s FROM lecturas WHERE city IS NOT NULL GROUP BY city, region ORDER BY n DESC LIMIT 40) t),
    'porHora', (SELECT COALESCE(jsonb_agg(jsonb_build_object('hora', hour, 'lecturas', n) ORDER BY hour), '[]'::jsonb)
      FROM (SELECT hour, count(*) n FROM lecturas GROUP BY hour) t),
    'porDia', (SELECT COALESCE(jsonb_agg(jsonb_build_object('dia', day, 'lecturas', n, 'sesiones', s) ORDER BY day), '[]'::jsonb)
      FROM (SELECT day, count(*) n, count(DISTINCT session) s FROM lecturas GROUP BY day) t),
    'seccionCiudad', (SELECT COALESCE(jsonb_agg(jsonb_build_object('seccion', section, 'ciudad', city, 'lecturas', n, 'sesiones', s) ORDER BY n DESC), '[]'::jsonb)
      FROM (SELECT section, city, count(*) n, count(DISTINCT session) s FROM lecturas
            WHERE section IS NOT NULL AND city IS NOT NULL GROUP BY section, city ORDER BY n DESC LIMIT 200) t),
    'notasMasLeidas', (SELECT COALESCE(jsonb_agg(jsonb_build_object('slug', slug, 'lecturas', n) ORDER BY n DESC), '[]'::jsonb)
      FROM (SELECT slug, count(*) n FROM lecturas WHERE type = 'nota' AND slug IS NOT NULL GROUP BY slug ORDER BY n DESC LIMIT 20) t)
  );
$$;

-- 4. Filas agregadas para exportar a CSV (sección × ciudad × día × plataforma)
CREATE OR REPLACE FUNCTION public.alcance_filas(p_desde DATE, p_hasta DATE)
RETURNS TABLE (dia DATE, seccion TEXT, ciudad TEXT, region TEXT, pais TEXT, plataforma TEXT, lecturas BIGINT, sesiones BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT day, section, city, region, country, platform, count(*), count(DISTINCT session)
  FROM public.app_events
  WHERE day BETWEEN p_desde AND p_hasta AND type IN ('nota', 'seccion')
  GROUP BY day, section, city, region, country, platform
  ORDER BY day DESC, count(*) DESC;
$$;

-- Solo el servidor las llama (el panel comprueba el rol admin antes).
REVOKE ALL ON FUNCTION public.alcance_resumen(DATE, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.alcance_filas(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alcance_resumen(DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.alcance_filas(DATE, DATE) TO service_role;

-- 5. Limpieza: los eventos de más de 13 meses se pueden borrar sin perder
--    nada útil (se comparan años completos). Ejecutar a mano cuando se quiera:
--    DELETE FROM public.app_events WHERE day < (now() AT TIME ZONE 'America/Bogota')::date - 400;

-- Comprobación: debe devolver un JSON con totales en cero, sin error.
SELECT public.alcance_resumen(current_date - 30, current_date);
