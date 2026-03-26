import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ✅ Primero verifica si es colaborador
  const { data: esColaborador } = await admin
    .from('colaboradores')
    .select('id, negocio_id, permisos, nombre, email, estado')
    .eq('user_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  if (esColaborador) {
    // Es colaborador — devuelve el negocio del dueño
    const { data: negocioDueno } = await admin
      .from('negocios')
      .select('*')
      .eq('id', esColaborador.negocio_id)
      .maybeSingle()

    return Response.json({
      negocio: negocioDueno,
      colaboradores: [],
      rol: 'colaborador'
    })
  }

  // Es dueño — busca o crea su negocio
  let { data: negocio } = await admin
    .from('negocios')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!negocio) {
    const { data: nuevo } = await admin
      .from('negocios')
      .insert([{ owner_id: user.id, nombre: 'Mi Negocio' }])
      .select()
      .single()
    negocio = nuevo
  }

  const { data: colaboradores } = await admin
    .from('colaboradores')
    .select('*')
    .eq('negocio_id', negocio.id)

  return Response.json({
    negocio,
    colaboradores: colaboradores || [],
    rol: 'dueño'
  })
}

export async function POST(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()

  if (body.accion === 'actualizar_nombre') {
    const { data } = await admin
      .from('negocios')
      .update({ nombre: body.nombre })
      .eq('owner_id', user.id)
      .select()
      .single()
    return Response.json(data)
  }

  if (body.accion === 'invitar_colaborador') {
    const { data: negocio } = await admin
      .from('negocios')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!negocio) return Response.json({ error: 'No tienes un negocio' }, { status: 400 })

    // ✅ Busca si ya existe un usuario con ese email en auth
    const { data: usuarios } = await admin.auth.admin.listUsers()
    const usuarioExistente = usuarios?.users?.find(
      u => u.email?.toLowerCase() === body.email?.toLowerCase()
    )

    const { data, error } = await admin
      .from('colaboradores')
      .insert([{
        negocio_id: negocio.id,
        email: body.email.toLowerCase(),
        nombre: body.nombre || body.email,
        permisos: body.permisos,
        // ✅ Si ya tiene cuenta, lo vincula y activa directamente
        user_id: usuarioExistente?.id || null,
        estado: usuarioExistente ? 'activo' : 'pendiente'
      }])
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  if (body.accion === 'actualizar_permisos') {
    const { data } = await admin
      .from('colaboradores')
      .update({ permisos: body.permisos })
      .eq('id', body.colaborador_id)
      .select()
      .single()
    return Response.json(data)
  }

  if (body.accion === 'eliminar_colaborador') {
    await admin
      .from('colaboradores')
      .delete()
      .eq('id', body.colaborador_id)
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Acción no reconocida' }, { status: 400 })
}