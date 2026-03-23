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

export async function POST(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { messages } = await request.json()

  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const ingresos = movimientos?.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0) || 0
  const egresos = movimientos?.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0) || 0

  const systemPrompt = `Eres el Socio Experto de Socio Pro, un asesor financiero y educador para emprendedores latinoamericanos.

DATOS ACTUALES DEL NEGOCIO:
- Ingresos totales: $${ingresos.toLocaleString()}
- Egresos totales: $${egresos.toLocaleString()}
- Balance: $${(ingresos - egresos).toLocaleString()}
- Movimientos registrados: ${movimientos?.length || 0}

FORMATO OBLIGATORIO DE RESPUESTA:
Siempre responde en este formato exacto con estos 3 bloques:

🎓 EXPERTO
[Respuesta en lenguaje 100% técnico y profesional, como un contador o MBA. Usa términos financieros reales: EBITDA, flujo de caja, margen operacional, liquidez, SKU, rentabilidad, etc.]

🤝 SOCIO
[La misma información en lenguaje simple y cotidiano, como un amigo que entiende de negocios. Sin términos técnicos. Directo y práctico. Termina con UNA acción concreta.]

📚 APRENDE HOY
[Define 1 o 2 términos técnicos que usaste en el bloque EXPERTO. Formato: **Término**: definición simple en 1 oración.]

REGLAS:
1. Siempre usa los 3 bloques, sin excepción
2. Termina el bloque SOCIO con UNA acción concreta
3. El bloque APRENDE HOY debe tener términos que aparecieron en EXPERTO
4. Nunca digas que eres una IA
5. Nunca omitas ninguno de los 3 bloques aunque la pregunta sea simple`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  })

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || 'No pude conectarme ahora, intenta de nuevo.'

  return Response.json({ reply })
}