import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()

  // Mercado Pago envía notificaciones de tipo preapproval (suscripción)
  const { type, data } = body

  if (type !== 'preapproval') {
    return Response.json({ ok: true })
  }

  // Obtener detalles de la suscripción desde MP
  const res = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
    headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  })

  const sub = await res.json()

  if (!res.ok) {
    console.error('MP webhook error:', sub)
    return Response.json({ error: 'Error obteniendo suscripción' }, { status: 500 })
  }

  const negocioId = sub.external_reference
  if (!negocioId) return Response.json({ ok: true })

  const estado = sub.status // authorized | paused | cancelled | pending

  if (estado === 'authorized') {
    // Activar plan Pro
    const vence = new Date()
    vence.setMonth(vence.getMonth() + 1)

    await admin.from('negocios').update({
      plan: 'pro',
      mp_subscription_id: sub.id,
      plan_vence_at: vence.toISOString(),
    }).eq('id', negocioId)

  } else if (estado === 'cancelled' || estado === 'paused') {
    // Desactivar plan Pro
    await admin.from('negocios').update({
      plan: 'gratis',
      mp_subscription_id: null,
      plan_vence_at: null,
    }).eq('id', negocioId)
  }

  return Response.json({ ok: true })
}