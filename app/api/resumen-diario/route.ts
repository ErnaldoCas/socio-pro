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

  const { data: negocio } = await admin
    .from('negocios').select('id, nombre, plan').eq('owner_id', user.id).maybeSingle()

  const { data: colaborador } = await admin
    .from('colaboradores').select('negocio_id')
    .eq('user_id', user.id).eq('estado', 'activo').maybeSingle()

  const negocioId = negocio?.id || colaborador?.negocio_id
  if (!negocioId) return Response.json({ insights: [] })

  const hoy = new Date().toISOString().split('T')[0]

  // Verificar si ya hay resumen para hoy
  const { data: resumenExistente } = await admin
    .from('resumen_diario')
    .select('insights')
    .eq('negocio_id', negocioId)
    .eq('fecha', hoy)
    .maybeSingle()

  if (resumenExistente) {
    return Response.json({ insights: resumenExistente.insights })
  }

  // Generar nuevo resumen con datos reales
  const { data: movimientos } = await admin
    .from('movimientos').select('*')
    .eq('negocio_id', negocioId)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: productos } = await admin
    .from('productos').select('*').eq('user_id', user.id)

  if (!movimientos?.length) {
    const insights = [
      { tipo: 'neutro', texto: 'Aún no tienes movimientos registrados. ¡Empieza hoy! 🚀' }
    ]
    return Response.json({ insights })
  }

  // Calcular métricas para el prompt
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const balance = ingresos - egresos
  const margen = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0

  const hace7dias = new Date(); hace7dias.setDate(hace7dias.getDate() - 7)
  const hace14dias = new Date(); hace14dias.setDate(hace14dias.getDate() - 14)
  const mov7dias = movimientos.filter(m => new Date(m.created_at) >= hace7dias)
  const mov7a14dias = movimientos.filter(m => new Date(m.created_at) >= hace14dias && new Date(m.created_at) < hace7dias)

  const ing7 = mov7dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const ing7a14 = mov7a14dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const eg7 = mov7dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo) || []

  const porCategoria = movimientos.reduce((acc: any, m) => {
    const cat = m.categoria || 'general'
    if (!acc[cat]) acc[cat] = 0
    if (m.tipo === 'egreso') acc[cat] += m.monto
    return acc
  }, {})
  const categoriaTopEgreso = Object.entries(porCategoria).sort((a: any, b: any) => b[1] - a[1])[0]

  const prompt = `Analiza estos datos financieros y genera exactamente 3 insights breves en español chileno, cercano y humano.

DATOS:
- Balance total: $${balance.toLocaleString()} (margen ${margen}%)
- Ingresos últimos 7 días: $${ing7.toLocaleString()} vs semana anterior: $${ing7a14.toLocaleString()}
- Egresos últimos 7 días: $${eg7.toLocaleString()}
- Productos con stock bajo: ${stockBajo.length > 0 ? stockBajo.map(p => p.nombre).join(', ') : 'ninguno'}
- Categoría con más gastos: ${categoriaTopEgreso ? `${categoriaTopEgreso[0]} ($${Number(categoriaTopEgreso[1]).toLocaleString()})` : 'sin datos'}
- Total movimientos: ${movimientos.length}

REGLAS:
1. Exactamente 3 insights
2. Cada uno en máximo 12 palabras
3. Tono cercano y chileno, como un amigo
4. Asigna tipo: "positivo", "alerta" o "neutro"
5. Responde SOLO con JSON válido, sin markdown, sin explicaciones

FORMATO EXACTO:
[{"tipo":"positivo","texto":"texto aquí"},{"tipo":"alerta","texto":"texto aquí"},{"tipo":"neutro","texto":"texto aquí"}]`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    })
  })

  const data = await response.json()
  let insights = []

  try {
    const texto = data.choices?.[0]?.message?.content || '[]'
    const limpio = texto.replace(/```json|```/g, '').trim()
    insights = JSON.parse(limpio)
  } catch {
    insights = [
      { tipo: 'neutro', texto: 'Tu negocio sigue activo. ¡Sigue registrando! 💪' }
    ]
  }

  // Guardar en caché para hoy
  await admin.from('resumen_diario').upsert({
    negocio_id: negocioId,
    fecha: hoy,
    insights
  }, { onConflict: 'negocio_id,fecha' })

  return Response.json({ insights })
}