import crypto from 'node:crypto'
import { getSettings } from '@/lib/settings'

// Pasarela de pagos configurable (Wompi por defecto). Toda la configuración se
// lee desde site_settings (editable por Mario en el panel). Si las llaves no
// están cargadas, devolvemos null y la UI muestra "pago no disponible aún".

const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/'
const CURRENCY = 'COP'

type CheckoutParams = {
  reference: string       // identificador único (id de pauta o suscripción)
  amountCop: number       // monto en pesos (lo convertimos a centavos)
  redirectUrl: string     // a dónde vuelve el usuario tras pagar
  customerEmail?: string
}

// Construye la URL de Web Checkout con la firma de integridad. null si falta config.
export async function buildCheckoutUrl(params: CheckoutParams): Promise<string | null> {
  const settings = await getSettings()
  const publicKey = settings.gateway_public_key
  const integrity = settings.gateway_integrity_secret
  if (!publicKey || !integrity) return null

  const amountInCents = Math.round(params.amountCop * 100)
  const reference = params.reference

  // Firma de integridad: SHA256( reference + amountInCents + currency + integritySecret )
  const signature = crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${CURRENCY}${integrity}`)
    .digest('hex')

  const qs = new URLSearchParams({
    'public-key': publicKey,
    'currency': CURRENCY,
    'amount-in-cents': String(amountInCents),
    'reference': reference,
    'signature:integrity': signature,
    'redirect-url': params.redirectUrl,
  })
  if (params.customerEmail) qs.set('customer-data:email', params.customerEmail)

  return `${WOMPI_CHECKOUT_URL}?${qs.toString()}`
}

// Verifica la firma de un evento (webhook) de Wompi usando el secreto de eventos.
// Wompi firma con SHA256 concatenando los valores de `signature.properties` en
// orden + timestamp + eventsSecret.
export async function verifyEventSignature(payload: {
  data?: { transaction?: Record<string, unknown> }
  signature?: { properties?: string[]; checksum?: string }
  timestamp?: number
}): Promise<boolean> {
  const settings = await getSettings()
  const secret = settings.gateway_events_secret
  if (!secret) return false
  const props = payload.signature?.properties
  const checksum = payload.signature?.checksum
  const timestamp = payload.timestamp
  if (!props || !checksum || timestamp === undefined) return false

  const tx = (payload.data?.transaction ?? {}) as Record<string, unknown>
  let concatenated = ''
  for (const prop of props) {
    // prop tiene la forma "transaction.<campo>" (posiblemente anidado con puntos)
    const path = prop.replace(/^transaction\./, '').split('.')
    let value: unknown = tx
    for (const key of path) {
      value = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined
    }
    concatenated += value ?? ''
  }
  concatenated += timestamp
  concatenated += secret

  const computed = crypto.createHash('sha256').update(concatenated).digest('hex')
  return computed.toLowerCase() === checksum.toLowerCase()
}
