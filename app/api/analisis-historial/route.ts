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

// GET — obtener historial del negocio
export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data: negocio } = await admin
    .from('negocios').select('id').eq('owner_id', user.id).single()

  if (!negocio) return Response.json([])

  const { data, error } = await admin
    .from('analisis_historial')
    .select('*')
    .eq('negocio_id', negocio.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

// POST — guardar un análisis
export async function POST(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { pregunta, respuesta } = await request.json()
  if (!pregunta || !respuesta) return Response.json({ error: 'Faltan datos' }, { status: 400 })

  const { data: negocio } = await admin
    .from('negocios').select('id').eq('owner_id', user.id).single()

  if (!negocio) return Response.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { data, error } = await admin
    .from('analisis_historial')
    .insert([{ negocio_id: negocio.id, user_id: user.id, pregunta, respuesta }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}

// DELETE — eliminar un análisis
export async function DELETE(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await admin
    .from('analisis_historial')
    .delete()
    .eq('id', id!)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}