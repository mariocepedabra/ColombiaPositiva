-- =============================================================
-- COLOMBIA POSITIVA — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- 1. TABLA PROFILES (extiende auth.users)
-- ---------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'lector' CHECK (role IN ('admin', 'columnista', 'lector')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver perfiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins pueden actualizar cualquier perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ---------------------------------------------------------------
-- 2. TABLA ARTICLES
-- ---------------------------------------------------------------
CREATE TABLE public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category_slug TEXT NOT NULL CHECK (
    category_slug IN ('economia', 'medio-ambiente', 'cultura', 'deporte', 'ciencia', 'regiones')
  ),
  image_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Redacción Colombia Positiva',
  author_id UUID REFERENCES public.profiles(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_time INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede leer artículos publicados
CREATE POLICY "Artículos publicados son públicos"
  ON public.articles FOR SELECT
  USING (is_published = true);

-- Admins tienen control total
CREATE POLICY "Admins controlan todos los artículos"
  ON public.articles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Columnistas gestionan solo sus propios artículos
CREATE POLICY "Columnistas gestionan sus propios artículos"
  ON public.articles FOR ALL TO authenticated
  USING (
    author_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'columnista')
  )
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'columnista')
  );

-- ---------------------------------------------------------------
-- 3. TABLA NOTA POSITIVA SUBMISSIONS
-- ---------------------------------------------------------------
CREATE TABLE public.nota_positiva_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  region TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.nota_positiva_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede enviar una Nota Positiva"
  ON public.nota_positiva_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Solo admins pueden leer las submissions"
  ON public.nota_positiva_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------
-- 4. TRIGGER: auto-crear perfil al registrarse
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.email = 'mariocepedabra@gmail.com' THEN 'admin'
      ELSE 'lector'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- 5. TRIGGER: auto-actualizar updated_at en articles
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_articles_updated
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------
-- 6. STORAGE: bucket para imágenes de artículos
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imágenes de artículos son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

CREATE POLICY "Usuarios autenticados pueden subir imágenes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'article-images');

CREATE POLICY "Admins pueden eliminar imágenes"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'article-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
