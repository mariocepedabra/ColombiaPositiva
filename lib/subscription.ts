export type PlanId = '1d' | '1m' | '6m' | '1y'

export type Plan = {
  id: PlanId
  name: string
  priceCop: number
  usdLabel: string
  popular?: boolean
  durationDays: number | null // días que dura la suscripción
}

export const PLANS: Plan[] = [
  { id: '1d', name: '1 día',    priceCop: 10_000,  usdLabel: '≈ USD $3',  durationDays: 1 },
  { id: '1m', name: '1 mes',    priceCop: 30_000,  usdLabel: '≈ USD $9',  durationDays: 30, popular: true },
  { id: '6m', name: '6 meses',  priceCop: 70_000,  usdLabel: '≈ USD $20', durationDays: 182 },
  { id: '1y', name: '1 año',    priceCop: 110_000, usdLabel: '≈ USD $30', durationDays: 365 },
]

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

export function formatCop(value: number): string {
  return '$' + value.toLocaleString('es-CO') + ' COP'
}
