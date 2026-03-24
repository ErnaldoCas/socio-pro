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

  const { data: negocio } = await supabase
    .from('negocios')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('negocio_id')
    .eq('user_id', user.id)
    .single()

  let query = supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (negocio) {
    query = query.eq('user_id', user.id)
  } else if (colaborador) {
    const { data: dueno } = await supabase
      .from('negocios')
      .select('owner_id')
      .eq('id', colaborador.negocio_id)
      .single()
    if (dueno) query = query.eq('user_id', dueno.owner_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

export async function POST(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, permisos, negocio_id')
    .eq('user_id', user.id)
    .single()

  if (colaborador && !colaborador.permisos?.editar_inventario) {
    return Response.json({ error: 'Sin permiso para editar inventario' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: body.nombre,
      stock: Number(body.stock) || 0,
      precio: Number(body.precio) || 0,
      costo: Number(body.costo) || 0,
      stock_minimo: Number(body.stock_minimo) || 5,
      categoria: body.categoria || 'general',
      user_id: user.id
    }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}

export async function PUT(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('permisos')
    .eq('user_id', user.id)
    .single()

  if (colaborador && !colaborador.permisos?.editar_inventario) {
    return Response.json({ error: 'Sin permiso para editar inventario' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('productos')
    .update({
      stock: Number(body.stock) || 0,
      precio: Number(body.precio) || 0,
      costo: Number(body.costo) || 0,
      stock_minimo: Number(body.stock_minimo) || 5
    })
    .eq('id', body.id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}