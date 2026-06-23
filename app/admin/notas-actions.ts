'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Verifica que el usuario actual sea admin. Devuelve true/false.
async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  let role = (user.app_metadata as Record<string, string>)?.role ?? 'lector'
  try {
    const { data: rpcData } = await supabase.rpc('get_my_profile')
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      role = (rpcData[0] as { role: string }).role || role
    }
  } catch { /* usar app_metadata */ }
  return role === 'admin'
}

// Elimina una Nota Positiva enviada por el público.
// La tabla nota_positiva_submissions solo permite SELECT a admin vía RLS y no
// tiene política de DELETE, por eso se usa service role (igual que las pautas).
export async function deleteNotaSubmission(id: string): Promise<{ error?: string }> {
  if (!await isCurrentUserAdmin()) return { error: 'Sin permisos' }
  const admin = createAdminClient()
  const { error } = await admin.from('nota_positiva_submissions').delete().eq('id', id)
  if (error) {
    console.error('[deleteNotaSubmission]', error.message)
    return { error: error.message }
  }
  revalidatePath('/admin/notas-positivas')
  return {}
}
