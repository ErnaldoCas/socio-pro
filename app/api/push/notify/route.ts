import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { negocioId, title, body, url } = await request.json()
  if (!negocioId) return Response.json({ error: 'negocioId requerido' }, { status: 400 })

  // ✅ Dentro de la función para evitar error en build time
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'hola@sociopro.cl'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { data: suscripciones } = await admin
    .from('push_subscriptions')
    .select('*')
    .eq('negocio_id', negocioId)

  if (!suscripciones?.length) return Response.json({ ok: true, enviados: 0 })

  const payload = JSON.stringify({
    title,
    body,
    url: url || '/inventario',
    tag: 'stock-bajo'
  })

  const resultados = await Promise.allSettled(
    suscripciones.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err: any) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        throw err
      })
    )
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  return Response.json({ ok: true, enviados })
}