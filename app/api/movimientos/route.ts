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

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Descuento automático de stock ───────────────────────────────────────────
// Busca si el concepto menciona un producto del inventario y descuenta stock
async function descontarStockSiCorresponde(
  concepto: string,
  tipo: string,
  negocioId: string,
  duenoUserId: string
) {
  // Solo descuenta en ingresos (ventas)
  if (tipo !== 'ingreso') return

  const admin = getAdmin()

  // Traer todos los productos del negocio
  const { data: productos } = await admin
    .from('productos')
    .select('id, nombre, stock, stock_minimo')
    .eq('user_id', duenoUserId)

  if (!productos?.length) return

  const conceptoLower = concepto.toLowerCase()

  for (const producto of productos) {
    const nombreLower = producto.nombre.toLowerCase()

    // ¿El concepto menciona este producto?
    if (!conceptoLower.includes(nombreLower)) continue

    // Detectar cantidad — busca número antes o después del nombre del producto
    // Ejemplos: "3 completos", "completos x5", "2 empanadas a 1500"
    let cantidad = 1

    const matchAntes = concepto.match(new RegExp(`(\\d+)\\s+${nombreLower}`, 'i'))
    const matchDespues = concepto.match(new RegExp(`${nombreLower}\\s*[x×]?\\s*(\\d+)`, 'i'))

    if (matchAntes) cantidad = parseInt(matchAntes[1])
    else if (matchDespues) cantidad = parseInt(matchDespues[1])

    // Descontar stock (mínimo 0)
    const nuevoStock = Math.max(0, producto.stock - cantidad)

    await admin
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto.id)

    // Si quedó bajo el mínimo, disparar notificación push (si está configurado)
    if (nuevoStock <= producto.stock_minimo) {
      const { data: negocio } = await admin
        .from('negocios')
        .select('id')
        .eq('owner_id', duenoUserId)
        .single()

      if (negocio) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app')}/api/push/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            negocioId: negocio.id,
            title: '⚠️ Stock bajo',
            body: `${producto.nombre} tiene solo ${nuevoStock} unidades`,
            url: '/inventario',
          }),
        }).catch(() => {})
      }
    }

    // Solo descuenta el primer producto que matchee
    break
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { searchParams } = new URL(request.url)
  const colaboradorId = searchParams.get('colaborador_id')

  const { data: negocio } = await admin
    .from('negocios')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const { data: colaborador } = await admin
    .from('colaboradores')
    .select('id, negocio_id')
    .eq('user_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  let query = admin
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })

  if (negocio) {
    query = query.eq('negocio_id', negocio.id)
    if (colaboradorId) query = query.eq('colaborador_id', colaboradorId)
  } else if (colaborador) {
    query = query.eq('negocio_id', colaborador.negocio_id)
    query = query.eq('colaborador_id', colaborador.id)
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

  const admin = getAdmin()
  const body = await request.json()

  const { data: colaborador } = await admin
    .from('colaboradores')
    .select('id, negocio_id')
    .eq('user_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  const { data: negocio } = await admin
    .from('negocios')
    .select('id, owner_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const negocioId = negocio?.id || colaborador?.negocio_id || null
  if (!negocioId) return Response.json({ error: 'No se encontró negocio asociado' }, { status: 400 })

  const { data, error } = await admin
    .from('movimientos')
    .insert([{
      concepto: body.concepto,
      monto: body.monto,
      tipo: body.tipo,
      categoria: body.categoria,
      user_id: user.id,
      colaborador_id: colaborador?.id || null,
      negocio_id: negocioId
    }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // ✅ Descontar stock si es una venta que menciona un producto del inventario
  // Obtener el owner_id del negocio para buscar sus productos
  let duenoUserId = negocio?.owner_id || user.id
  if (!negocio && colaborador) {
    const { data: negocioDelColaborador } = await admin
      .from('negocios')
      .select('owner_id')
      .eq('id', colaborador.negocio_id)
      .single()
    if (negocioDelColaborador) duenoUserId = negocioDelColaborador.owner_id
  }

  await descontarStockSiCorresponde(
    body.concepto,
    body.tipo,
    negocioId,
    duenoUserId
  )

  return Response.json(data[0])
}

export async function PUT(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const body = await request.json()

  const { data, error } = await admin
    .from('movimientos')
    .update({
      concepto: body.concepto,
      monto: Number(body.monto),
      tipo: body.tipo,
      categoria: body.categoria
    })
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}

export async function DELETE(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await admin
    .from('movimientos')
    .delete()
    .eq('id', id!)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}