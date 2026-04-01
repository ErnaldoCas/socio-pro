import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

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

async function notificarStockBajo(producto, negocioId, origin) {
  if (producto.stock > producto.stock_minimo) return
  try {
    await fetch(`${origin}/api/push/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        negocioId,
        title: '⚠️ Stock bajo',
        body: `${producto.nombre} tiene solo ${producto.stock} unidades (mínimo: ${producto.stock_minimo})`,
        url: '/inventario',
      }),
    })
  } catch {}
}

async function getNegocioId(userId) {
  const admin = getAdmin()
  const { data: negocio } = await admin
    .from('negocios').select('id').eq('owner_id', userId).single()
  if (negocio) return negocio.id
  const { data: colaborador } = await admin
    .from('colaboradores').select('negocio_id').eq('user_id', userId).single()
  return colaborador?.negocio_id || null
}

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()

  const { data: negocio } = await admin
    .from('negocios').select('id').eq('owner_id', user.id).maybeSingle()

  const { data: colaborador } = await admin
    .from('colaboradores').select('negocio_id').eq('user_id', user.id).maybeSingle()

  let query = admin.from('productos').select('*').order('nombre', { ascending: true })

  if (negocio) {
    query = query.eq('user_id', user.id)
  } else if (colaborador) {
    const { data: dueno } = await admin
      .from('negocios').select('owner_id').eq('id', colaborador.negocio_id).single()
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

  const admin = getAdmin()

  const { data: colaborador } = await admin
    .from('colaboradores').select('id, permisos, negocio_id').eq('user_id', user.id).maybeSingle()

  if (colaborador && !colaborador.permisos?.editar_inventario) {
    return Response.json({ error: 'Sin permiso para editar inventario' }, { status: 403 })
  }

  const body = await request.json()
  const stock = Number(body.stock) || 0
  const stockMinimo = Number(body.stock_minimo) || 5

  const { data, error } = await admin
    .from('productos')
    .insert([{
      nombre: body.nombre,
      stock,
      precio: Number(body.precio) || 0,
      costo: Number(body.costo) || 0,
      stock_minimo: stockMinimo,
      categoria: body.categoria || 'general',
      user_id: user.id
    }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const negocioId = await getNegocioId(user.id)
  if (negocioId && data[0]) {
    const origin = request.headers.get('origin') || ''
    await notificarStockBajo(data[0], negocioId, origin)
  }

  return Response.json(data[0])
}

export async function PUT(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()

  const { data: colaborador } = await admin
    .from('colaboradores').select('permisos').eq('user_id', user.id).maybeSingle()

  if (colaborador && !colaborador.permisos?.editar_inventario) {
    return Response.json({ error: 'Sin permiso para editar inventario' }, { status: 403 })
  }

  const body = await request.json()
  const stock = Number(body.stock) || 0
  const stockMinimo = Number(body.stock_minimo) || 5

  const { data, error } = await admin
    .from('productos')
    .update({ stock, precio: Number(body.precio) || 0, costo: Number(body.costo) || 0, stock_minimo: stockMinimo })
    .eq('id', body.id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const negocioId = await getNegocioId(user.id)
  if (negocioId && data[0]) {
    const origin = request.headers.get('origin') || ''
    await notificarStockBajo(data[0], negocioId, origin)
  }

  return Response.json(data[0])
}

export async function PATCH(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()

  const { data: colaborador } = await admin
    .from('colaboradores').select('permisos').eq('user_id', user.id).maybeSingle()

  if (colaborador && !colaborador.permisos?.editar_inventario) {
    return Response.json({ error: 'Sin permiso para editar inventario' }, { status: 403 })
  }

  const body = await request.json()
  const { id, delta } = body

  const { data: producto } = await admin
    .from('productos').select('stock, stock_minimo, nombre').eq('id', id).single()

  if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 })

  const nuevoStock = Math.max(0, producto.stock + delta)

  const { data, error } = await admin
    .from('productos').update({ stock: nuevoStock }).eq('id', id).select()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const negocioId = await getNegocioId(user.id)
  if (negocioId && data[0]) {
    const origin = request.headers.get('origin') || ''
    await notificarStockBajo(data[0], negocioId, origin)
  }

  return Response.json(data[0])
}

export async function DELETE(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await admin
    .from('productos').delete().eq('id', id).eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}