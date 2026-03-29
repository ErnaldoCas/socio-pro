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

// ─── Descuento de stock ───────────────────────────────────────────────────────
async function descontarStock(textoOriginal: string, tipo: string, duenoUserId: string) {
  if (tipo !== 'ingreso') return

  const admin = getAdmin()
  const { data: productos } = await admin
    .from('productos')
    .select('id, nombre, stock, stock_minimo')
    .eq('user_id', duenoUserId)

  if (!productos?.length) return

  const t = textoOriginal.toLowerCase()

  for (const producto of productos) {
    const nombre = producto.nombre.toLowerCase()
    if (!t.includes(nombre)) continue

    // Detectar cantidad antes o después del nombre del producto
    const escaped = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const reAntes = new RegExp(`(\\d+)\\s+${escaped}`)
    const reDespues = new RegExp(`${escaped}\\s*[x×]?\\s*(\\d+)`)
    const mAntes = t.match(reAntes)
    const mDespues = t.match(reDespues)

    let cantidad = 1
    if (mAntes) cantidad = parseInt(mAntes[1])
    else if (mDespues) cantidad = parseInt(mDespues[1])

    const nuevoStock = Math.max(0, producto.stock - cantidad)
    await admin.from('productos').update({ stock: nuevoStock }).eq('id', producto.id)
    break // Solo el primer producto que matchee
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
    .from('negocios').select('id').eq('owner_id', user.id).maybeSingle()

  const { data: colaborador } = await admin
    .from('colaboradores').select('id, negocio_id')
    .eq('user_id', user.id).eq('estado', 'activo').maybeSingle()

  let query = admin.from('movimientos').select('*').order('created_at', { ascending: false })

  if (negocio) {
    query = query.eq('negocio_id', negocio.id)
    if (colaboradorId) query = query.eq('colaborador_id', colaboradorId)
  } else if (colaborador) {
    query = query.eq('negocio_id', colaborador.negocio_id).eq('colaborador_id', colaborador.id)
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
    .from('colaboradores').select('id, negocio_id')
    .eq('user_id', user.id).eq('estado', 'activo').maybeSingle()

  const { data: negocio } = await admin
    .from('negocios').select('id, owner_id').eq('owner_id', user.id).maybeSingle()

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

  // ✅ Usar textoOriginal (enviado desde el frontend) para detectar producto y cantidad
  const textoParaMatch = body.textoOriginal || body.concepto || ''
  let duenoUserId = negocio?.owner_id || user.id

  if (!negocio && colaborador) {
    const { data: neg } = await admin
      .from('negocios').select('owner_id').eq('id', colaborador.negocio_id).single()
    if (neg) duenoUserId = neg.owner_id
  }

  await descontarStock(textoParaMatch, body.tipo, duenoUserId)

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
    .update({ concepto: body.concepto, monto: Number(body.monto), tipo: body.tipo, categoria: body.categoria })
    .eq('id', body.id).eq('user_id', user.id).select()

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
    .from('movimientos').delete().eq('id', id!).eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}