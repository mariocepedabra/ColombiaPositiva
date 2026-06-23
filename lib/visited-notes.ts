// Historial de notas visitadas, guardado en el navegador del usuario
// (localStorage). Es por dispositivo/navegador y no requiere base de datos, lo
// que lo hace inmediato y privado. Lo escribe ViewTracker en cada artículo y lo
// lee la página /perfil.

export const VISITED_NOTES_KEY = 'cp_notas_visitadas'
export const VISITED_NOTES_EVENT = 'cp-visited-notes-changed'
export const VISITED_NOTES_MAX = 100

export type VisitedNote = { slug: string; title: string; at: string }

// Avisa a los componentes suscritos (en la misma pestaña) que el historial cambió.
function notifyChange(): void {
  try {
    window.dispatchEvent(new Event(VISITED_NOTES_EVENT))
  } catch {
    /* noop */
  }
}

export function recordVisitedNote(slug: string, title: string): void {
  if (typeof window === 'undefined' || !slug) return
  try {
    const raw = window.localStorage.getItem(VISITED_NOTES_KEY)
    const list: VisitedNote[] = raw ? JSON.parse(raw) : []
    const safe = Array.isArray(list) ? list : []
    // La nota visitada de nuevo sube al principio (sin duplicarse)
    const filtered = safe.filter((n) => n && n.slug !== slug)
    filtered.unshift({ slug, title: title || slug, at: new Date().toISOString() })
    window.localStorage.setItem(VISITED_NOTES_KEY, JSON.stringify(filtered.slice(0, VISITED_NOTES_MAX)))
    notifyChange()
  } catch {
    /* localStorage no disponible (modo privado, etc.) — ignorar */
  }
}

export function clearVisitedNotes(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(VISITED_NOTES_KEY)
    notifyChange()
  } catch {
    /* noop */
  }
}

// Snapshot crudo (string) para useSyncExternalStore — referencialmente estable
// mientras el contenido no cambie, evitando renders en bucle.
export function getVisitedNotesRaw(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(VISITED_NOTES_KEY) ?? ''
  } catch {
    return ''
  }
}

// Suscripción para useSyncExternalStore: cambios en esta y en otras pestañas.
export function subscribeVisitedNotes(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(VISITED_NOTES_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(VISITED_NOTES_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function parseVisitedNotes(raw: string): VisitedNote[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? (list as VisitedNote[]).filter((n) => n && n.slug) : []
  } catch {
    return []
  }
}
