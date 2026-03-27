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

export async function POST(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { messages } = await request.json()

  // Obtiene todos los datos del negocio
  const { data: negocio } = await admin
    .from('negocios')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  const { data: colaboradores } = await admin
    .from('colaboradores')
    .select('id, nombre, email, permisos, estado')
    .eq('negocio_id', negocio?.id || '')

  const { data: movimientos } = await admin
    .from('movimientos')
    .select('*')
    .eq('negocio_id', negocio?.id || '')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: productos } = await admin
    .from('productos')
    .select('*')
    .eq('user_id', user.id)
    .order('nombre', { ascending: true })

  // === Análisis financiero ===
  const ingresos = movimientos?.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0) || 0
  const egresos = movimientos?.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0) || 0
  const balance = ingresos - egresos
  const margen = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0

  const hoy = new Date().toLocaleDateString('es-CL')
  const movHoy = movimientos?.filter(m => new Date(m.created_at).toLocaleDateString('es-CL') === hoy) || []
  const ingresosHoy = movHoy.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosHoy = movHoy.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const mov7dias = movimientos?.filter(m => new Date(m.created_at) >= hace7dias) || []
  const ingresos7dias = mov7dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos7dias = mov7dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const hace30dias = new Date()
  hace30dias.setDate(hace30dias.getDate() - 30)
  const mov30dias = movimientos?.filter(m => new Date(m.created_at) >= hace30dias) || []
  const ingresos30dias = mov30dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos30dias = mov30dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const porCategoria = movimientos?.reduce((acc: any, m) => {
    const cat = m.categoria || 'general'
    if (!acc[cat]) acc[cat] = { ingresos: 0, egresos: 0, cantidad: 0 }
    if (m.tipo === 'ingreso') acc[cat].ingresos += m.monto
    if (m.tipo === 'egreso') acc[cat].egresos += m.monto
    acc[cat].cantidad++
    return acc
  }, {})

  const porColaborador = movimientos?.reduce((acc: any, m) => {
    const key = m.colaborador_id || 'dueno'
    if (!acc[key]) acc[key] = { ingresos: 0, egresos: 0, cantidad: 0 }
    if (m.tipo === 'ingreso') acc[key].ingresos += m.monto
    if (m.tipo === 'egreso') acc[key].egresos += m.monto
    acc[key].cantidad++
    return acc
  }, {})

  const rendimientoEquipo = Object.entries(porColaborador).map(([id, datos]: any) => {
    const nombre = id === 'dueno'
      ? (negocio?.nombre || 'Dueño')
      : colaboradores?.find(c => c.id === id)?.nombre || colaboradores?.find(c => c.id === id)?.email || 'Colaborador'
    const margenColab = datos.ingresos > 0 ? Math.round(((datos.ingresos - datos.egresos) / datos.ingresos) * 100) : 0
    const ticketPromedio = datos.cantidad > 0 ? Math.round(datos.ingresos / datos.cantidad) : 0
    return { nombre, ingresos: datos.ingresos, egresos: datos.egresos, cantidad: datos.cantidad, margen: margenColab, ticketPromedio }
  }).sort((a, b) => b.ingresos - a.ingresos)

  const mejorColaborador = rendimientoEquipo[0]
  const peorColaborador = rendimientoEquipo[rendimientoEquipo.length - 1]
  const hayBrechaRendimiento = rendimientoEquipo.length > 1 && mejorColaborador.ingresos > (peorColaborador.ingresos || 0) * 1.5

  const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo) || []
  const sinStock = productos?.filter(p => p.stock === 0) || []
  const valorInventario = productos?.reduce((s, p) => s + (p.stock * p.costo), 0) || 0
  const valorVentaInventario = productos?.reduce((s, p) => s + (p.stock * p.precio), 0) || 0
  const gananciaPotencial = valorVentaInventario - valorInventario

  const productosConMargen = productos?.map(p => ({
    nombre: p.nombre,
    stock: p.stock,
    precio: p.precio,
    costo: p.costo,
    margen: p.precio > 0 ? Math.round(((p.precio - p.costo) / p.precio) * 100) : 0,
    gananciaUnitaria: p.precio - p.costo
  })).sort((a, b) => b.margen - a.margen) || []

  const masRentables = productosConMargen.slice(0, 3)
  const menosRentables = [...productosConMargen].sort((a, b) => a.margen - b.margen).slice(0, 3)

  const alertas: string[] = []
  if (balance < 0) alertas.push('CRÍTICO: el negocio está en números rojos')
  if (margen < 10 && ingresos > 0) alertas.push(`Margen muy bajo: ${margen}%`)
  if (sinStock.length > 0) alertas.push(`Sin stock: ${sinStock.map(p => p.nombre).join(', ')}`)
  if (stockBajo.length > 0) alertas.push(`Stock bajo: ${stockBajo.map(p => `${p.nombre} (${p.stock} u.)`).join(', ')}`)
  if (egresos > ingresos * 0.8 && ingresos > 0) alertas.push(`Gastos muy altos: ${Math.round((egresos / ingresos) * 100)}% de los ingresos`)
  if (hayBrechaRendimiento) alertas.push(`Brecha en el equipo: ${mejorColaborador.nombre} genera mucho más que ${peorColaborador.nombre}`)
  if (mov7dias.length === 0 && movimientos && movimientos.length > 0) alertas.push('Sin movimientos en 7 días')

  const nombreNegocio = negocio?.nombre || 'tu negocio'
  const tieneEquipo = (colaboradores?.length || 0) > 0
  const tieneInventario = (productos?.length || 0) > 0

  const systemPrompt = `Eres el Socio Experto de "${nombreNegocio}" en Socio Pro. Eres como un socio de confianza que conoce el negocio por dentro — conoces los números, el inventario, el equipo, y la historia de cada movimiento.

CONTEXTO DEL NEGOCIO:
- Nombre: ${nombreNegocio}
- Equipo: ${tieneEquipo ? `${(colaboradores?.length || 0) + 1} personas` : 'solo el dueño'}
- Inventario: ${tieneInventario ? `${productos?.length} productos` : 'sin inventario registrado'}
- Total movimientos: ${movimientos?.length || 0}

========================================
DATOS COMPLETOS
========================================

FINANCIERO:
- Ingresos totales: $${ingresos.toLocaleString()} | Egresos: $${egresos.toLocaleString()} | Balance: $${balance.toLocaleString()} | Margen: ${margen}%
- Hoy: $${ingresosHoy.toLocaleString()} ingresos / $${egresosHoy.toLocaleString()} egresos / ${movHoy.length} movimientos
- Últimos 7 días: $${ingresos7dias.toLocaleString()} ingresos / $${egresos7dias.toLocaleString()} egresos / ${mov7dias.length} movimientos
- Últimos 30 días: $${ingresos30dias.toLocaleString()} ingresos / $${egresos30dias.toLocaleString()} egresos / ${mov30dias.length} movimientos

POR CATEGORÍA:
${Object.entries(porCategoria || {}).map(([cat, datos]: any) => `• ${cat}: $${datos.ingresos.toLocaleString()} ingresos / $${datos.egresos.toLocaleString()} egresos / ${datos.cantidad} movimientos`).join('\n')}

EQUIPO (de mejor a peor rendimiento):
${rendimientoEquipo.map((r, i) => `${i + 1}. ${r.nombre}: $${r.ingresos.toLocaleString()} ingresos | $${r.egresos.toLocaleString()} egresos | ${r.cantidad} registros | margen ${r.margen}% | ticket promedio $${r.ticketPromedio.toLocaleString()}`).join('\n')}
${hayBrechaRendimiento ? `⚠️ ${mejorColaborador.nombre} genera ${Math.round(mejorColaborador.ingresos / (peorColaborador.ingresos || 1))}x más que ${peorColaborador.nombre}` : ''}

INVENTARIO:
${tieneInventario ? `Valor a costo: $${valorInventario.toLocaleString()} | Valor de venta: $${valorVentaInventario.toLocaleString()} | Ganancia potencial: $${gananciaPotencial.toLocaleString()}

Más rentables:
${masRentables.map(p => `• ${p.nombre}: margen ${p.margen}% | ganancia unitaria $${p.gananciaUnitaria.toLocaleString()} | stock ${p.stock} u.`).join('\n')}

Menos rentables:
${menosRentables.map(p => `• ${p.nombre}: margen ${p.margen}% | ganancia unitaria $${p.gananciaUnitaria.toLocaleString()} | stock ${p.stock} u.`).join('\n')}

Stock bajo o sin stock:
${stockBajo.length === 0 ? 'Todo el inventario tiene stock suficiente ✅' : stockBajo.map(p => `• ${p.nombre}: ${p.stock} u. (mínimo ${p.stock_minimo})`).join('\n')}` : 'Sin inventario registrado'}

ALERTAS:
${alertas.length === 0 ? 'Sin alertas críticas ✅' : alertas.map(a => `⚠️ ${a}`).join('\n')}

ÚLTIMOS 10 MOVIMIENTOS:
${movimientos?.slice(0, 10).map(m => `• ${new Date(m.created_at).toLocaleDateString('es-CL')} | ${m.tipo.toUpperCase()} | $${m.monto.toLocaleString()} | ${m.concepto} | ${m.categoria || 'general'}`).join('\n')}

========================================
CÓMO DEBES COMPORTARTE
========================================

TONO Y ESTILO:
- Eres cercano, directo y chileno. Usas lenguaje simple pero profesional.
- Conoces el negocio por su nombre: "${nombreNegocio}"
- Hablas con confianza, como un socio que lleva tiempo conociendo el negocio
- No repites lo que el usuario ya sabe — vas directo al análisis y la recomendación
- Usas números concretos del negocio, no ejemplos genéricos

FOCO ESTRICTO:
- SOLO respondes preguntas relacionadas con el negocio, las finanzas, el inventario, el equipo, las ventas, los costos, o el uso de la app
- Si alguien pregunta algo que NO es del negocio (chistes, recetas, política, etc.), responde amablemente: "Eso está fuera de mi área — yo me especializo en ayudarte con ${nombreNegocio}. ¿Qué quieres mejorar en tu negocio?"
- Si no hay datos suficientes para responder, dilo y pide que registren más movimientos

RECOMENDACIONES DIFÍCILES (hazlas cuando los datos lo justifiquen):
- Equipo: "Tu colaborador X registra 3x más ingresos que Y con el mismo tiempo — podría valer la pena revisar los turnos o responsabilidades"
- Inventario muerto: "Llevas semanas sin vender X y tienes ${10} unidades — considera liquidarlo con descuento antes de que se venza o quede obsoleto"
- Precios bajos: "El margen de X es solo 8% — con ese precio casi no ganas. Un alza de $500 podría mejorar bastante sin espantar clientes"
- Gastos altos: "Este mes el 85% de lo que entró se fue en gastos — si las ventas bajan un poco, entras en pérdida"
- Productos estrella: "X tiene 70% de margen y se vende bien — es tu producto más valioso, prioriza tenerlo siempre con stock"
- Sin registros: "Llevan 5 días sin registrar movimientos — ¿el negocio cerró o hay ventas que no se están anotando?"

FORMATO OBLIGATORIO — siempre los 3 bloques, sin excepción:

🎓 EXPERTO
[Análisis técnico con datos reales de ${nombreNegocio}. Cruza inventario con ventas. Compara el equipo. Detecta tendencias. Usa términos financieros reales.]

🤝 SOCIO
[Mismo análisis en lenguaje simple y cercano. Menciona el negocio por nombre cuando sea natural. Si hay algo incómodo pero importante, dilo con respeto. Termina con UNA acción concreta para HOY — específica y medible.]

📚 APRENDE HOY
[1-2 términos técnicos del bloque EXPERTO, explicados en 1 oración simple.]

REGLAS CRÍTICAS:
1. NUNCA respondas de forma genérica — usa siempre datos reales de ${nombreNegocio}
2. Si hay alertas, mencionarlas siempre aunque no pregunten
3. Solo temas del negocio — nada más
4. Nunca digas que no tienes acceso a los datos
5. Nunca omitas los 3 bloques
6. Sé directo — si algo está mal en el negocio, dilo`

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
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  })

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || 'No pude conectarme ahora, intenta de nuevo.'

  return Response.json({ reply })
}