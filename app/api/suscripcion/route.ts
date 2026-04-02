import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// POST — crear suscripción y devolver link de pago
export async function POST(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data: negocio } = await admin
    .from('negocios').select('id, nombre, plan').eq('owner_id', user.id).single()

  if (!negocio) return Response.json({ error: 'Negocio no encontrado' }, { status: 404 })
  if (negocio.plan === 'pro') return Response.json({ error: 'Ya tienes el plan Pro' }, { status: 400 })

  const origin = request.headers.get('origin') || 'https://socio-pro.vercel.app'

  // Crear suscripción en Mercado Pago
  const res = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Socio Pro — Plan mensual',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 7990,
        currency_id: 'CLP',
      },
      back_url: `${origin}/precios?pago=exitoso`,
      payer_email: user.email,
      external_reference: negocio.id, // usamos negocio_id para identificar en webhook
    }),
  })

  const data = await res.json()

  if (!res.ok || !data.init_point) {
    console.error('MP error:', data)
    return Response.json({ error: 'No se pudo crear la suscripción' }, { status: 500 })
  }

  return Response.json({ url: data.init_point })
}

// GET — obtener estado del plan actual
export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data: negocio } = await admin
    .from('negocios')
    .select('plan, plan_vence_at, mp_subscription_id')
    .eq('owner_id', user.id)
    .single()

  return Response.json({
    plan: negocio?.plan || 'gratis',
    vence: negocio?.plan_vence_at || null,
    subscriptionId: negocio?.mp_subscription_id || null,
  })
}