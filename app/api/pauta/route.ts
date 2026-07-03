import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPricing } from '@/lib/pricing'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      advertiserName, company, email, phone, targetUrl,
      mediaUrl, mediaType, days,
    } = body

    if (!advertiserName || !mediaUrl || !mediaType || !days) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const numDays = Math.max(1, parseInt(String(days), 10) || 1)
    const pricing = await getPricing()
    const price = numDays * pricing.adPerDay

    // Inserción server-side con service role (devuelve el id de forma fiable
    // y evita problemas de visibilidad RLS con la anon key)
    const supabase = createAdminClient()
    const { data: created, error: insertErr } = await supabase
      .from('ad_submissions')
      .insert({
        advertiser_name: advertiserName,
        company: company || null,
        email: email || null,
        phone: phone || null,
        target_url: targetUrl || null,
        media_url: mediaUrl,
        media_type: mediaType,
        days: numDays,
        price,
        status: 'pendiente',
        paid: false,
      })
      .select('id')
      .single()

    if (insertErr || !created) {
      console.error('[pauta] DB error:', insertErr)
      return NextResponse.json({ error: 'Error al guardar la solicitud' }, { status: 500 })
    }

    const adId = created.id as string | undefined

    // Notificar a Mario por email
    try {
      const adminEmail = process.env.ADMIN_EMAIL!
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      await resend.emails.send({
        from: `Colombia Positiva <${fromEmail}>`,
        to: adminEmail,
        subject: `📢 Nueva solicitud de pauta — ${company || advertiserName}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1c1c1c;">
            <div style="background: #013262; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Colombia Positiva</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; font-style: italic;">Nueva solicitud de pauta publicitaria</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e8e8e4; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="font-size:12px;font-family:sans-serif;font-weight:bold;text-transform:uppercase;color:#9a9a90;padding:8px 0;width:140px;">Anunciante</td><td style="font-size:14px;font-family:sans-serif;padding:8px 0;">${advertiserName}</td></tr>
                ${company ? `<tr><td style="font-size:12px;font-family:sans-serif;font-weight:bold;text-transform:uppercase;color:#9a9a90;padding:8px 0;border-top:1px solid #e8e8e4;">Empresa</td><td style="font-size:14px;font-family:sans-serif;padding:8px 0;border-top:1px solid #e8e8e4;">${company}</td></tr>` : ''}
                ${email ? `<tr><td style="font-size:12px;font-family:sans-serif;font-weight:bold;text-transform:uppercase;color:#9a9a90;padding:8px 0;border-top:1px solid #e8e8e4;">Correo</td><td style="font-size:14px;font-family:sans-serif;padding:8px 0;border-top:1px solid #e8e8e4;">${email}</td></tr>` : ''}
                ${phone ? `<tr><td style="font-size:12px;font-family:sans-serif;font-weight:bold;text-transform:uppercase;color:#9a9a90;padding:8px 0;border-top:1px solid #e8e8e4;">Teléfono</td><td style="font-size:14px;font-family:sans-serif;padding:8px 0;border-top:1px solid #e8e8e4;">${phone}</td></tr>` : ''}
                <tr><td style="font-size:12px;font-family:sans-serif;font-weight:bold;text-transform:uppercase;color:#9a9a90;padding:8px 0;border-top:1px solid #e8e8e4;">Duración</td><td style="font-size:14px;font-family:sans-serif;padding:8px 0;border-top:1px solid #e8e8e4;">${numDays} día(s) — $${price.toLocaleString('es-CO')} COP</td></tr>
                <tr><td style="font-size:12px;font-family:sans-serif;font-weight:bold;text-transform:uppercase;color:#9a9a90;padding:8px 0;border-top:1px solid #e8e8e4;">${mediaType === 'video' ? 'Video' : 'Imagen'}</td><td style="font-size:14px;font-family:sans-serif;padding:8px 0;border-top:1px solid #e8e8e4;"><a href="${mediaUrl}" style="color:#013262;word-break:break-all;">Ver banner</a></td></tr>
              </table>
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://colombiapositiva.com/admin/pautas" style="display:inline-block;background:#013262;color:white;font-family:sans-serif;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;padding:12px 24px;text-decoration:none;">Revisar en el panel →</a>
              </div>
            </div>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('[pauta] email error (no crítico):', mailErr)
    }

    return NextResponse.json({ success: true, id: adId, price, days: numDays })
  } catch (error) {
    console.error('[pauta] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
