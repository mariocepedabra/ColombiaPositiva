// Formateo determinista de fechas y números para el panel de métricas.
//
// No se usa `Intl` (toLocaleDateString / toLocaleString) porque el servidor
// renderiza en UTC y el navegador en la zona del usuario, y además las
// versiones de ICU de Node y del navegador abrevian los meses distinto.
// Cualquiera de las dos cosas rompe la hidratación de React. Estas funciones
// producen exactamente el mismo texto en los dos lados.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Colombia es UTC-5 todo el año: no tiene horario de verano. */
const OFFSET_BOGOTA_MS = -5 * 60 * 60 * 1000

type Partes = { dia: number; mes: number; anio: number; hora: number; minuto: number }

function partesEnBogota(iso: string): Partes | null {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const d = new Date(t + OFFSET_BOGOTA_MS)
  return {
    dia: d.getUTCDate(),
    mes: d.getUTCMonth(),
    anio: d.getUTCFullYear(),
    hora: d.getUTCHours(),
    minuto: d.getUTCMinutes(),
  }
}

/** Separador de miles con punto, como en español de Colombia. */
export function num(n: number): string {
  const entero = Math.trunc(Math.abs(n)).toString()
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return n < 0 ? `-${conPuntos}` : conPuntos
}

/** "30 ago" */
export function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const p = partesEnBogota(iso)
  if (!p) return '—'
  return `${p.dia} ${MESES[p.mes]}`
}

/** "30 ago 2026" */
export function fecha(iso: string | null): string {
  if (!iso) return '—'
  const p = partesEnBogota(iso)
  if (!p) return '—'
  return `${p.dia} ${MESES[p.mes]} ${p.anio}`
}

/** "30 ago 2026, 3:52 p. m." */
export function fechaHora(iso: string | null): string {
  if (!iso) return '—'
  const p = partesEnBogota(iso)
  if (!p) return '—'
  const sufijo = p.hora < 12 ? 'a. m.' : 'p. m.'
  const hora12 = p.hora % 12 === 0 ? 12 : p.hora % 12
  const minuto = String(p.minuto).padStart(2, '0')
  return `${p.dia} ${MESES[p.mes]} ${p.anio}, ${hora12}:${minuto} ${sufijo}`
}

/** Etiqueta de un día ya guardado como 'YYYY-MM-DD' (sin pasar por Date). */
export function diaCorto(day: string): string {
  const [, mes, dia] = day.split('-')
  const indice = Number(mes) - 1
  if (!MESES[indice] || !dia) return day
  return `${Number(dia)} ${MESES[indice]}`
}
