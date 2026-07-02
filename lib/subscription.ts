import type { Pricing } from '@/lib/pricing'
import { DEFAULT_PRICING } from '@/lib/pricing'

export type PlanId = '1d' | '1m' | '6m' | '1y'

export type Plan = {
  id: PlanId
  name: string
  priceCop: number
  usdLabel: string
  popular?: boolean
  durationDays: number | null // días que dura la suscripción
}

// Tasa aproximada COP→USD para la etiqueta "≈ USD $X". Solo referencial.
const COP_PER_USD = 3_800

export function usdLabel(cop: number): string {
  return '≈ USD $' + Math.max(1, Math.round(cop / COP_PER_USD))
}

// Metadatos de cada plan (sin precio). El precio viene de la configuración.
const PLAN_META: { id: PlanId; name: string; durationDays: number | null; popular?: boolean; priceKey: keyof Pricing }[] = [
  { id: '1d', name: '1 día',   durationDays: 1,   priceKey: 'sub1d' },
  { id: '1m', name: '1 mes',   durationDays: 30,  priceKey: 'sub1m', popular: true },
  { id: '6m', name: '6 meses', durationDays: 182, priceKey: 'sub6m' },
  { id: '1y', name: '1 año',   durationDays: 365, priceKey: 'sub1y' },
]

// Construye los planes con los precios configurados (editables en el panel).
export function buildPlans(pricing: Pricing): Plan[] {
  return PLAN_META.map((m) => ({
    id: m.id,
    name: m.name,
    priceCop: pricing[m.priceKey],
    usdLabel: usdLabel(pricing[m.priceKey]),
    durationDays: m.durationDays,
    popular: m.popular,
  }))
}

// Planes con precios por defecto (para consumidores que solo necesitan el
// nombre o la duración, p. ej. el webhook o el perfil).
export const PLANS: Plan[] = buildPlans(DEFAULT_PRICING)

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

// Devuelve un plan con el precio actualmente configurado.
export function getPlanFromPricing(pricing: Pricing, id: string): Plan | undefined {
  return buildPlans(pricing).find((p) => p.id === id)
}

export function formatCop(value: number): string {
  return '$' + value.toLocaleString('es-CO') + ' COP'
}
