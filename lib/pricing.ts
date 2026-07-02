import { readConfigJson, writeConfigJson } from '@/lib/app-config-store'

// Precios editables desde el panel (COP). Se guardan como JSON en el bucket
// privado app-config, sin cambios en la base de datos. SOLO servidor.

export type Pricing = {
  adPerDay: number // precio de pauta por día
  sub1d: number    // suscripción 1 día
  sub1m: number    // suscripción 1 mes
  sub6m: number    // suscripción 6 meses
  sub1y: number    // suscripción 1 año
}

export const DEFAULT_PRICING: Pricing = {
  adPerDay: 10_000,
  sub1d: 10_000,
  sub1m: 30_000,
  sub6m: 70_000,
  sub1y: 110_000,
}

const PATH = 'prices.json'

function coerce(v: unknown, def: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : def
}

function normalize(raw: Partial<Pricing>): Pricing {
  return {
    adPerDay: coerce(raw.adPerDay, DEFAULT_PRICING.adPerDay),
    sub1d: coerce(raw.sub1d, DEFAULT_PRICING.sub1d),
    sub1m: coerce(raw.sub1m, DEFAULT_PRICING.sub1m),
    sub6m: coerce(raw.sub6m, DEFAULT_PRICING.sub6m),
    sub1y: coerce(raw.sub1y, DEFAULT_PRICING.sub1y),
  }
}

export async function getPricing(): Promise<Pricing> {
  const raw = await readConfigJson<Pricing>(PATH, DEFAULT_PRICING)
  return normalize(raw)
}

export async function setPricing(next: Pricing): Promise<{ error?: string }> {
  return writeConfigJson(PATH, normalize(next))
}
