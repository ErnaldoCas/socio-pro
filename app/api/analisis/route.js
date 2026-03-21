import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()

  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: productos } = await supabase
    .from('productos')
    .select('*')

  const ingresos = movimientos?.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0) || 0
  const egresos = movimientos?.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0) || 0
  const balance = ingresos - egresos
  const margen = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0
  const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo) || []

  const categorias = movimientos?.reduce((acc, m) => {
    if (!acc[m.categoria]) acc[m.categoria] = { ingresos: 0, egresos: 0 }
    if (m.tipo === 'ingreso') acc[m.categoria].ingresos += m.monto
    if (m.tipo === 'egreso') acc[m.categoria].egresos += m.monto
    return acc
  }, {})

  const systemPrompt = `Eres el Socio Experto de Socio Pro. Analiza estos datos y entrega un análisis profundo pero en lenguaje simple para un emprendedor sin conocimientos financieros.

DATOS DEL NEGOCIO:
- Ingresos totales: $${ingresos.toLocaleString()}
- Egresos totales: $${egresos.toLocaleString()}
- Balance: $${balance.toLocaleString()}
- Margen: ${margen}%
- Movimientos registrados: ${movimientos?.length || 0}
- Productos con stock bajo: ${stockBajo.map(p => p.nombre).join(', ') || 'ninguno'}
- Categorías: ${JSON.stringify(categorias)}

INSTRUCCIONES:
Responde SOLO en formato JSON válido con esta estructura exacta:
{
  "resumen": "2-3 oraciones simples explicando cómo está el negocio hoy",
  "explicacion_simple": "explica el análisis como si le hablaras a alguien que nunca ha llevado cuentas, usa analogías cotidianas",
  "alertas": [
    { "tipo": "riesgo", "titulo": "titulo corto", "descripcion": "explicación simple en 1 oración" },
    { "tipo": "oportunidad", "titulo": "titulo corto", "descripcion": "explicación simple en 1 oración" },
    { "tipo": "estrategia", "titulo": "titulo corto", "descripcion": "acción concreta en 1 oración" }
  ],
  "accion_principal": "UNA sola acción concreta que debe hacer HOY"
}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7
    })
  })

  const data = await response.json()
  const texto = data.choices?.[0]?.message?.content || ''

  try {
    const clean = texto.replace(/```json|```/g, '').trim()
    const analisis = JSON.parse(clean)
    return Response.json({ analisis, metricas: { ingresos, egresos, balance, margen } })
  } catch {
    return Response.json({ error: 'No se pudo generar el análisis' }, { status: 500 })
  }
}