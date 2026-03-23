import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  let { data: negocio } = await supabase
    .from('negocios')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!negocio) {
    const { data: nuevo } = await supabase
      .from('negocios')
      .insert([{ owner_id: user.id, nombre: 'Mi Negocio' }])
      .select()
      .single()
    negocio = nuevo
  }

  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('*')
    .eq('negocio_id', negocio.id)

  return Response.json({ negocio, colaboradores: colaboradores || [] })
}

export async function POST(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  if (body.accion === 'actualizar_nombre') {
    const { data } = await supabase
      .from('negocios')
      .update({ nombre: body.nombre })
      .eq('owner_id', user.id)
      .select()
      .single()
    return Response.json(data)
  }

  if (body.accion === 'invitar_colaborador') {
    const { data: negocio } = await supabase
      .from('negocios')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!negocio) return Response.json({ error: 'No tienes un negocio' }, { status: 400 })

    const { data, error } = await supabase
      .from('colaboradores')
      .insert([{
        negocio_id: negocio.id,
        email: body.email,
        nombre: body.nombre || body.email,
        permisos: body.permisos
      }])
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  if (body.accion === 'actualizar_permisos') {
    const { data } = await supabase
      .from('colaboradores')
      .update({ permisos: body.permisos })
      .eq('id', body.colaborador_id)
      .select()
      .single()
    return Response.json(data)
  }

  if (body.accion === 'eliminar_colaborador') {
    await supabase
      .from('colaboradores')
      .delete()
      .eq('id', body.colaborador_id)
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Acción no reconocida' }, { status: 400 })
}