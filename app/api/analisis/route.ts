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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  // Obtener todos los datos del negocio
  const { data: negocio } = await admin
    .from('negocios').select('*').eq('owner_id', user.id).maybeSingle()

  const { data: movimientos } = await admin
    .from('movimientos').select('*')
    .eq('negocio_id', negocio?.id || '')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: productos } = await admin
    .from('productos').select('*').eq('user_id', user.id)

  const { data: colaboradores } = await admin
    .from('colaboradores').select('*').eq('negocio_id', negocio?.id || '')

  // Métricas financieras
  const ingresos = movimientos?.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0) || 0
  const egresos = movimientos?.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0) || 0
  const balance = ingresos - egresos
  const margen = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0

  const hoy = new Date().toLocaleDateString('es-CL')
  const movHoy = movimientos?.filter(m => new Date(m.created_at).toLocaleDateString('es-CL') === hoy) || []
  const ingresosHoy = movHoy.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosHoy = movHoy.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const hace7dias = new Date(); hace7dias.setDate(hace7dias.getDate() - 7)
  const mov7dias = movimientos?.filter(m => new Date(m.created_at) >= hace7dias) || []
  const ingresos7 = mov7dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos7 = mov7dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo) || []
  const sinStock = productos?.filter(p => p.stock === 0) || []
  const valorInventario = productos?.reduce((s, p) => s + (p.stock * p.costo), 0) || 0
  const gananciaPotencial = productos?.reduce((s, p) => s + (p.stock * (p.precio - p.costo)), 0) || 0

  const nombreNegocio = negocio?.nombre || 'tu negocio'

  const prompt = `Eres un analista financiero experto en negocios chilenos pequeños. Analiza estos datos de "${nombreNegocio}" y responde SOLO con un JSON válido, sin texto adicional, sin backticks, sin comentarios.

DATOS:
- Ingresos totales: $${ingresos.toLocaleString()} | Egresos: $${egresos.toLocaleString()} | Balance: $${balance.toLocaleString()} | Margen: ${margen}%
- Hoy: $${ingresosHoy.toLocaleString()} ingresos / $${egresosHoy.toLocaleString()} egresos / ${movHoy.length} movimientos
- Últimos 7 días: $${ingresos7.toLocaleString()} ingresos / $${egresos7.toLocaleString()} egresos / ${mov7dias.length} movimientos
- Total movimientos: ${movimientos?.length || 0}
- Productos: ${productos?.length || 0} | Sin stock: ${sinStock.map(p => p.nombre).join(', ') || 'ninguno'} | Stock bajo: ${stockBajo.map(p => `${p.nombre}(${p.stock})`).join(', ') || 'ninguno'}
- Valor inventario a costo: $${valorInventario.toLocaleString()} | Ganancia potencial: $${gananciaPotencial.toLocaleString()}
- Colaboradores: ${colaboradores?.length || 0}
- Últimos movimientos: ${movimientos?.slice(0, 5).map(m => `${m.tipo} $${m.monto} (${m.concepto})`).join(', ')}

Responde EXACTAMENTE con este JSON (sin nada más):
{
  "resumen": "análisis técnico en 2-3 oraciones con datos reales del negocio",
  "explicacion_simple": "lo mismo pero como se lo explicarías a un emprendedor en lenguaje simple y directo, máximo 2 oraciones",
  "alertas": [
    {
      "tipo": "riesgo|oportunidad|info",
      "titulo": "título corto",
      "descripcion": "descripción en 1 oración"
    }
  ],
  "accion_principal": "UNA acción específica y medible para hacer HOY"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1000
    })
  })

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''

  try {
    const clean = content.replace(/```json|```/g, '').trim()
    const analisis = JSON.parse(clean)
    return Response.json({ analisis })
  } catch {
    return Response.json({ error: 'No se pudo parsear el análisis' }, { status: 500 })
  }
}