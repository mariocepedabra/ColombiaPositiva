-- ============================================================================
-- Colombia Positiva — Sistema de Pautas + Suscripciones + Configuración
-- ----------------------------------------------------------------------------
-- Correr este script UNA vez en el editor SQL de Supabase.
-- Es ADITIVO: no modifica tablas existentes (articles, profiles, etc.).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: ¿el usuario actual es admin? (lee profiles con SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- 1. PAUTAS  (ad_submissions)
-- ============================================================================
create table if not exists public.ad_submissions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  advertiser_name   text not null,
  company           text,
  email             text,
  phone             text,
  target_url        text,
  media_type        text not null check (media_type in ('image','video')),
  media_url         text not null,
  days              int  not null default 1,
  price             numeric not null default 0,
  status            text not null default 'pendiente'
                    check (status in ('pendiente','activo','pausado','expirado','rechazado')),
  paid              boolean not null default false,
  payment_reference text,
  start_date        timestamptz,
  end_date          timestamptz,
  zones             text[] not null default '{}',
  sort_order        int not null default 0
);

create index if not exists ad_submissions_status_idx on public.ad_submissions (status);
create index if not exists ad_submissions_zones_idx  on public.ad_submissions using gin (zones);

alter table public.ad_submissions enable row level security;

-- Inserción pública (cualquiera puede enviar una solicitud de pauta)
drop policy if exists ad_insert_public on public.ad_submissions;
create policy ad_insert_public on public.ad_submissions
  for insert to anon, authenticated
  with check (true);

-- Lectura pública SOLO de anuncios activos y vigentes (para renderizar banners)
drop policy if exists ad_select_active_public on public.ad_submissions;
create policy ad_select_active_public on public.ad_submissions
  for select to anon, authenticated
  using (
    status = 'activo'
    and (start_date is null or start_date <= now())
    and (end_date   is null or end_date   >= now())
  );

-- Acceso total para admin (panel)
drop policy if exists ad_all_admin on public.ad_submissions;
create policy ad_all_admin on public.ad_submissions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 2. SUSCRIPCIONES  (subscriptions)
-- ============================================================================
create table if not exists public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  user_id           uuid references auth.users (id) on delete cascade,
  email             text,
  plan              text not null check (plan in ('1d','1m','6m','1y','manual')),
  source            text not null check (source in ('pago','manual')),
  start_date        timestamptz,
  end_date          timestamptz,                       -- null = indefinida (manual)
  status            text not null default 'pendiente_pago'
                    check (status in ('pendiente_pago','activa','vencida','cancelada')),
  payment_reference text
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

-- El usuario ve sus propias suscripciones
drop policy if exists sub_select_own on public.subscriptions;
create policy sub_select_own on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid());

-- Acceso total para admin
drop policy if exists sub_all_admin on public.subscriptions;
create policy sub_all_admin on public.subscriptions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ¿El usuario actual tiene una suscripción activa y vigente?
create or replace function public.has_active_subscription()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and status = 'activa'
      and (end_date is null or end_date >= now())
  );
$$;

-- ============================================================================
-- 3. CONFIGURACIÓN DEL SITIO  (site_settings) — fila única id=1
-- ============================================================================
create table if not exists public.site_settings (
  id                       int primary key default 1 check (id = 1),
  gateway_public_key       text,
  gateway_private_key      text,
  gateway_events_secret    text,
  gateway_integrity_secret text,
  ad_max_image_mb          int not null default 5,
  ad_max_video_mb          int not null default 50,
  updated_at               timestamptz not null default now()
);

-- Sembrar la fila única
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Solo admin puede leer/escribir vía RLS. El servidor usa service role (bypassa RLS).
-- NOTA: las llaves privadas/secretos jamás se exponen al cliente.
drop policy if exists settings_all_admin on public.site_settings;
create policy settings_all_admin on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
