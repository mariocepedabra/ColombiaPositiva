-- ============================================================================
--  2026-09-04_firma_colombia_positiva.sql
--  Las notas sin firma personal pasan a firmar como «Colombia Positiva»
-- ----------------------------------------------------------------------------
--  Colombia Positiva es un medio propio y firma como tal. Las notas que
--  llegaron de Página 10 bajo su cuenta editorial quedaron firmadas «Página 10»,
--  y deben decir «Colombia Positiva».
--
--  Solo se toca esa firma EXACTA. Los nombres propios (Mario Cepeda Bravo,
--  Albeiro Arciniegas, Oscar Seidel, «Columnista Invitado»…) se respetan: son
--  la autoría real de cada texto y cambiarlos sería atribuir mal el trabajo.
--
--  De aquí en adelante la conversión la hace sola la ruta /api/ingesta-p10.
--  Esta migración es solo para lo ya publicado.
--
--  Ejecutar en el SQL Editor de Supabase.
-- ============================================================================

-- 1. Antes de cambiar nada: cuántas filas se van a ver afectadas.
SELECT author_name, count(*) AS notas
FROM public.articles
WHERE btrim(author_name) IN ('Página 10', 'Pagina 10')
GROUP BY author_name;

-- 2. El cambio.
UPDATE public.articles
SET author_name = 'Colombia Positiva'
WHERE btrim(author_name) IN ('Página 10', 'Pagina 10');

-- 3. Comprobación: no debe quedar ninguna.
SELECT count(*) AS quedan_sin_convertir
FROM public.articles
WHERE btrim(author_name) IN ('Página 10', 'Pagina 10');

-- ----------------------------------------------------------------------------
--  Para deshacerlo, si hiciera falta:
--
--    UPDATE public.articles
--    SET author_name = 'Página 10'
--    WHERE author_name = 'Colombia Positiva';
--
--  Ojo: eso revertiría TODAS las que digan «Colombia Positiva», incluidas las
--  que se firmen así más adelante. Por eso conviene hacerlo pronto si se hace.
-- ----------------------------------------------------------------------------
