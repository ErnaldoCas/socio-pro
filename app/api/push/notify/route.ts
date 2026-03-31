import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
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

// POST — guardar suscripción
export async function POST(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { subscription } = await request.json()
  if (!subscription?.endpoint) return Response.json({ error: 'Suscripción inválida' }, { status: 400 })

  const { data: negocio } = await admin
    .from('negocios').select('id').eq('owner_id', user.id).maybeSingle()

  const { data: colaborador } = await admin
    .from('colaboradores').select('negocio_id').eq('user_id', user.id).maybeSingle()

  const negocioId = negocio?.id || colaborador?.negocio_id
  if (!negocioId) return Response.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { error } = await admin
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      negocio_id: negocioId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: 'user_id,endpoint' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

// DELETE — eliminar suscripción
export async function DELETE(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { endpoint } = await request.json()
  await admin.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
  return Response.json({ ok: true })
}