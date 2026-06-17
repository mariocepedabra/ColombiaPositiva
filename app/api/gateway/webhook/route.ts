import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyEventSignature } from '@/lib/gateway'
import { getPlan } from '@/lib/subscription'

// Webhook de la pasarela (Wompi). Recibe eventos de transacción, verifica la
// firma de eventos y, ante un pago APROBADO, marca la pauta como pagada o
// activa la suscripción correspondiente.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    const valid = await verifyEventSignature(payload)
    if (!valid) {
      console.error('[gateway/webhook] firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const tx = payload?.data?.transaction as { status?: string; reference?: string } | undefined
    if (!tx) return NextResponse.json({ received: true })

    // Solo nos interesan los pagos aprobados
    if (tx.status !== 'APPROVED') return NextResponse.json({ received: true })

    const reference = tx.reference || ''
    const admin = createAdminClient()

    if (reference.startsWith('pauta_')) {
      const adId = reference.slice('pauta_'.length)
      const { error } = await admin
        .from('ad_submissions')
        .update({ paid: true, payment_reference: reference })
        .eq('id', adId)
      if (error) console.error('[gateway/webhook] pauta update error:', error)
    } else if (reference.startsWith('sub_')) {
      const subId = reference.slice('sub_'.length)
      const { data: sub } = await admin
        .from('subscriptions')
        .select('plan')
        .eq('id', subId)
        .single()

      const plan = sub ? getPlan(sub.plan) : undefined
      const start = new Date()
      const end = plan?.durationDays
        ? new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
        : null

      const { error } = await admin
        .from('subscriptions')
        .update({
          status: 'activa',
          start_date: start.toISOString(),
          end_date: end ? end.toISOString() : null,
          payment_reference: reference,
        })
        .eq('id', subId)
      if (error) console.error('[gateway/webhook] sub update error:', error)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[gateway/webhook] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
