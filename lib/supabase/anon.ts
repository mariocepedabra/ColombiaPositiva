import { createClient } from '@supabase/supabase-js'

// Cliente anónimo sin sesión ni cookies, para lecturas públicas desde el
// servidor (rutas /api/app/*). Al no tocar cookies() puede usarse dentro de
// unstable_cache. Respeta RLS: solo ve lo publicado, igual que un visitante.
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    },
  )
}
