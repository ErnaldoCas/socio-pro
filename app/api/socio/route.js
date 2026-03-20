import { createClient } from '@/lib/supabase'

export async function POST(request) {
  const { messages } = await request.json()
  const supabase = createClient()

  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const ingresos = movimientos
    ?.filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0) || 0

  const egresos = movimientos
    ?.filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0) || 0

  const systemPrompt = `Eres el Socio Experto de Socio Pro, un asesor de negocios amigo para emprendedores.

DATOS ACTUALES DEL NEGOCIO:
- Ingresos totales: $${ingresos.toLocaleString()}
- Egresos totales: $${egresos.toLocaleString()}
- Balance: $${(ingresos - egresos).toLocaleString()}
- Movimientos registrados: ${movimientos?.length || 0}

REGLAS:
1. Habla como socio amigo, directo y simple
2. Sin términos financieros complejos
3. Máximo 3 párrafos cortos
4. Termina siempre con UNA acción concreta
5. Nunca digas que eres una IA`

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