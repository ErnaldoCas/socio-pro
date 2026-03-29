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

// Dispara notificación push si el stock quedó bajo el mínimo
async function notificarStockBajoSiCorresponde(
  producto: { id: string; nombre: string; stock: number; stock_minimo: number },
  negocioId: string,
  baseUrl: string
) {
  if (producto.stock <= producto.stock_minimo) {
    await fetch(`${baseUrl}/api/push/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        negocioId,
        title: '⚠️ Stock bajo',
        body: `${producto.nombre} tiene solo ${producto.stock} unidades (mínimo: ${producto.stock_minimo})`,
        url: '/inventario',
      }),
    }).catch(() => {}) // No bloquear si falla la notificación
  }
}

// Obtener negocio_id del usuario actual
async function getNegocioId(userId: string): Promise<string | null> {
  const { data: negocio } = await admin
    .from('negocios')
    .select('id')
    .eq('owner_id', userId)
    .single()
  if (negocio) return negocio.id

  const { data: colaborador } = await admin
    .from('colaboradores')
    .select('negocio_id')
    .eq('user_id', userId)
    .single()
  return colaborador?.negocio_id || null
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

export async function POST(request: Request) {
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
  const stock = Number(body.stock) || 0
  const stockMinimo = Number(body.stock_minimo) || 5

  const { data, error } = await supabase
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

  // Notificar si el stock inicial ya está bajo el mínimo
  const negocioId = await getNegocioId(user.id)
  if (negocioId && data[0]) {
    const baseUrl = request.headers.get('origin') || ''
    await notificarStockBajoSiCorresponde(data[0], negocioId, baseUrl)
  }

  return Response.json(data[0])
}

export async function PUT(request: Request) {
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
  const stock = Number(body.stock) || 0
  const stockMinimo = Number(body.stock_minimo) || 5

  const { data, error } = await supabase
    .from('productos')
    .update({ stock, precio: Number(body.precio) || 0, costo: Number(body.costo) || 0, stock_minimo: stockMinimo })
    .eq('id', body.id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Notificar si el stock quedó bajo el mínimo
  const negocioId = await getNegocioId(user.id)
  if (negocioId && data[0]) {
    const baseUrl = request.headers.get('origin') || ''
    await notificarStockBajoSiCorresponde(data[0], negocioId, baseUrl)
  }

  return Response.json(data[0])
}

export async function PATCH(request: Request) {
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
  const { id, delta } = body

  const { data: producto } = await supabase
    .from('productos')
    .select('stock, stock_minimo, nombre')
    .eq('id', id)
    .single()

  if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 })

  const nuevoStock = Math.max(0, producto.stock + delta)

  const { data, error } = await supabase
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Notificar si el nuevo stock quedó bajo el mínimo
  const negocioId = await getNegocioId(user.id)
  if (negocioId && data[0]) {
    const baseUrl = request.headers.get('origin') || ''
    await notificarStockBajoSiCorresponde(data[0], negocioId, baseUrl)
  }

  return Response.json(data[0])
}

export async function DELETE(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id!)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}