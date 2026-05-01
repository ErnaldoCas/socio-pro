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

function sinAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function detectarCantidad(texto: string, nombreProducto: string): number {
  const t = sinAcentos(texto)
  const nombre = sinAcentos(nombreProducto)
  const escaped = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const reNumAntes = new RegExp(`(\\d+)\\s+(?:un|una|unos|unas\\s+)?${escaped}`)
  const mNumAntes = t.match(reNumAntes)
  if (mNumAntes) {
    const cantidad = parseInt(mNumAntes[1])
    if (cantidad < 100) return cantidad
  }

  const reX = new RegExp(`${escaped}\\s*[x×]\\s*(\\d+)`)
  const mX = t.match(reX)
  if (mX) return Math.min(parseInt(mX[1]), 99)

  return 1
}

async function descontarStock(textoOriginal: string, tipo: string, duenoUserId: string) {
  if (tipo !== 'ingreso') return

  const admin = getAdmin()
  const { data: productos } = await admin
    .from('productos')
    .select('id, nombre, stock, stock_minimo')
    .eq('user_id', duenoUserId)

  if (!productos?.length) return

  const tNorm = sinAcentos(textoOriginal)

  for (const producto of productos) {
    const nombreNorm = sinAcentos(producto.nombre)
    if (!tNorm.includes(nombreNorm)) continue

    const cantidad = detectarCantidad(textoOriginal, producto.nombre)
    const nuevoStock = Math.max(0, producto.stock - cantidad)
    await admin.from('productos').update({ stock: nuevoStock }).eq('id', producto.id)
    break
  }
}

async function getDuenoUserId(userId: string, negocioId: string): Promise<string> {
  const admin = getAdmin()
  const { data: negocio } = await admin
    .from('negocios')
    .select('owner_id')
    .eq('id', negocioId)
    .single()
  return negocio?.owner_id || userId
}

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

  // ✅ Verificar límite de 50 movimientos para plan gratis
  const { data: planData } = await admin
    .from('negocios').select('plan').eq('id', negocioId).single()

  if (planData?.plan === 'gratis') {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count } = await admin
      .from('movimientos')
      .select('*', { count: 'exact', head: true })
      .eq('negocio_id', negocioId)
      .gte('created_at', inicioMes.toISOString())

    if ((count || 0) >= 30) {
      return Response.json({
        error: 'Límite del plan gratis alcanzado (30 movimientos/mes)',
        codigo: 'LIMITE_GRATIS'
      }, { status: 403 })
    }
  }

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

  const textoParaMatch = body.textoOriginal || body.concepto || ''
  const duenoUserId = await getDuenoUserId(user.id, negocioId)
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