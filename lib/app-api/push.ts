import { createAdminClient } from '@/lib/supabase/admin'
import { getCategoryBySlug } from '@/lib/data'

// Notificaciones push de la app. Al publicar una nota se avisa a todos los
// teléfonos registrados con la sección como título y el titular como
// cuerpo; tocarla abre la nota. El envío lo hace el servicio de Expo
// (exp.host), que a su vez habla con Apple (APNs) y Google (FCM); las
// credenciales se cargan en EAS, no aquí.
//
// Sin la migración 2026-09-21_push_y_alcance.sql no hay tabla de tokens y
// todo esto se ignora en silencio.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const LOTE = 100
const TOKEN_EXPO = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/

export type PlataformaPush = 'ios' | 'android'

export function esTokenExpo(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_EXPO.test(token)
}

export async function registrarToken(token: string, plataforma: PlataformaPush): Promise<{ ok: boolean }> {
  try {
    const { error } = await createAdminClient()
      .from('push_tokens')
      .upsert({ token, platform: plataforma, active: true, updated_at: new Date().toISOString(), last_error: null }, { onConflict: 'token' })
    return { ok: !error }
  } catch {
    return { ok: false }
  }
}

export async function darDeBajaToken(token: string): Promise<void> {
  try {
    await createAdminClient().from('push_tokens').update({ active: false, updated_at: new Date().toISOString() }).eq('token', token)
  } catch {
    /* sin tabla */
  }
}

type Mensaje = { to: string; title: string; body: string; data: Record<string, string>; sound: 'default'; channelId: string; priority: 'high' }
type Ticket = { status: 'ok' | 'error'; message?: string; details?: { error?: string } }

/**
 * Avisa a todos los dispositivos de una nota recién publicada. Se llama con
 * after() para no retrasar la respuesta al editor. Devuelve cuántos avisos
 * se enviaron (0 si no hay tabla o tokens).
 */
export async function enviarPushNota(nota: { slug: string; titulo: string; seccion: string }): Promise<number> {
  let tokens: string[] = []
  try {
    const { data, error } = await createAdminClient().from('push_tokens').select('token').eq('active', true).limit(20_000)
    if (error || !data) return 0
    tokens = (data as { token: string }[]).map((t) => t.token).filter(esTokenExpo)
  } catch {
    return 0
  }
  if (tokens.length === 0) return 0

  const titulo = getCategoryBySlug(nota.seccion)?.name ?? 'Colombia Positiva'
  const cuerpo = nota.titulo.length > 160 ? `${nota.titulo.slice(0, 157)}…` : nota.titulo
  let enviados = 0
  const caducados: string[] = []

  for (let i = 0; i < tokens.length; i += LOTE) {
    const lote = tokens.slice(i, i + LOTE)
    const mensajes: Mensaje[] = lote.map((to) => ({
      to,
      title: titulo,
      body: cuerpo,
      data: { slug: nota.slug, url: `colombiapositiva://nota/${nota.slug}` },
      sound: 'default',
      channelId: 'notas',
      priority: 'high',
    }))
    try {
      const r = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate' },
        body: JSON.stringify(mensajes),
        signal: AbortSignal.timeout(15_000),
      })
      const json = (await r.json().catch(() => ({}))) as { data?: Ticket[] }
      const tickets = json.data ?? []
      tickets.forEach((t, idx) => {
        if (t.status === 'ok') enviados++
        else if (t.details?.error === 'DeviceNotRegistered') caducados.push(lote[idx])
      })
    } catch (e) {
      console.error('[push] lote', e instanceof Error ? e.message : e)
    }
  }

  // Los tokens que Apple/Google ya no reconocen se desactivan.
  if (caducados.length > 0) {
    try {
      await createAdminClient()
        .from('push_tokens')
        .update({ active: false, last_error: 'DeviceNotRegistered', updated_at: new Date().toISOString() })
        .in('token', caducados)
    } catch {
      /* noop */
    }
  }
  console.log(`[push] "${nota.titulo.slice(0, 40)}" → ${enviados} avisos (${caducados.length} caducados)`)
  return enviados
}
