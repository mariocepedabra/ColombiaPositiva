import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, title, description, region, mediaUrl, mediaType } = body

    if (!name || !title || !description) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Guardar en Supabase usando fetch directo con la anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 })
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/nota_positiva_submissions`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        name,
        email: email || null,
        title,
        description,
        region: region || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
      }),
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      console.error('DB error:', insertRes.status, errText)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    // Enviar email a Mario
    const adminEmail = process.env.ADMIN_EMAIL!
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    await resend.emails.send({
      from: `Colombia Positiva <${fromEmail}>`,
      to: adminEmail,
      subject: `📬 Nueva Nota Positiva — ${title}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1c1c1c;">
          <div style="background: #013262; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">Colombia Positiva</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; font-style: italic;">
              Nueva historia enviada por un lector
            </p>
          </div>

          <div style="padding: 32px; border: 1px solid #e8e8e4; border-top: none;">
            <h2 style="font-size: 22px; color: #1c1c1c; margin: 0 0 8px;">${title}</h2>
            <div style="border-left: 3px solid #013262; padding-left: 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #2e2e2e;">${description}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
              <tr>
                <td style="font-size: 12px; font-family: sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #9a9a90; padding: 8px 0; border-top: 1px solid #e8e8e4; width: 120px;">Enviado por</td>
                <td style="font-size: 14px; font-family: sans-serif; padding: 8px 0; border-top: 1px solid #e8e8e4;">${name}</td>
              </tr>
              ${email ? `
              <tr>
                <td style="font-size: 12px; font-family: sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #9a9a90; padding: 8px 0; border-top: 1px solid #e8e8e4;">Correo</td>
                <td style="font-size: 14px; font-family: sans-serif; padding: 8px 0; border-top: 1px solid #e8e8e4;"><a href="mailto:${email}" style="color: #013262;">${email}</a></td>
              </tr>` : ''}
              ${region ? `
              <tr>
                <td style="font-size: 12px; font-family: sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #9a9a90; padding: 8px 0; border-top: 1px solid #e8e8e4;">Región</td>
                <td style="font-size: 14px; font-family: sans-serif; padding: 8px 0; border-top: 1px solid #e8e8e4;">${region}</td>
              </tr>` : ''}
              ${mediaUrl ? `
              <tr>
                <td style="font-size: 12px; font-family: sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #9a9a90; padding: 8px 0; border-top: 1px solid #e8e8e4;">${mediaType === 'video' ? 'Video' : 'Imagen'}</td>
                <td style="font-size: 14px; font-family: sans-serif; padding: 8px 0; border-top: 1px solid #e8e8e4;"><a href="${mediaUrl}" style="color: #013262; word-break: break-all;">${mediaUrl}</a></td>
              </tr>` : ''}
            </table>

            <div style="margin-top: 32px; text-align: center;">
              <a href="https://colombiapositiva.com/admin/notas-positivas"
                style="display: inline-block; background: #013262; color: white; font-family: sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 12px 24px; text-decoration: none;">
                Ver en el panel →
              </a>
            </div>
          </div>

          <div style="padding: 16px; text-align: center; background: #f5f5f3;">
            <p style="font-size: 11px; font-family: sans-serif; color: #9a9a90; margin: 0;">
              Colombia Positiva · colombiapositiva.com
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en nota-positiva API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
