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

  // Obtiene negocio del usuario
  const { data: negocio } = await admin
    .from('negocios')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Obtiene colaboradores
  const { data: colaboradores } = await admin
    .from('colaboradores')
    .select('id, nombre, email, permisos, estado')
    .eq('negocio_id', negocio?.id || '')

  // Obtiene todos los movimientos del negocio
  const { data: movimientos } = await admin
    .from('movimientos')
    .select('*')
    .eq('negocio_id', negocio?.id || '')
    .order('created_at', { ascending: false })
    .limit(200)

  // Obtiene inventario completo
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

  // Hoy
  const hoy = new Date().toLocaleDateString('es-CL')
  const movHoy = movimientos?.filter(m => new Date(m.created_at).toLocaleDateString('es-CL') === hoy) || []
  const ingresosHoy = movHoy.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosHoy = movHoy.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Últimos 7 días
  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const mov7dias = movimientos?.filter(m => new Date(m.created_at) >= hace7dias) || []
  const ingresos7dias = mov7dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos7dias = mov7dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Últimos 30 días
  const hace30dias = new Date()
  hace30dias.setDate(hace30dias.getDate() - 30)
  const mov30dias = movimientos?.filter(m => new Date(m.created_at) >= hace30dias) || []
  const ingresos30dias = mov30dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos30dias = mov30dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Por categoría
  const porCategoria = movimientos?.reduce((acc: any, m) => {
    const cat = m.categoria || 'general'
    if (!acc[cat]) acc[cat] = { ingresos: 0, egresos: 0, cantidad: 0 }
    if (m.tipo === 'ingreso') acc[cat].ingresos += m.monto
    if (m.tipo === 'egreso') acc[cat].egresos += m.monto
    acc[cat].cantidad++
    return acc
  }, {})

  // Por colaborador con análisis detallado
  const porColaborador = movimientos?.reduce((acc: any, m) => {
    const key = m.colaborador_id || 'dueno'
    if (!acc[key]) acc[key] = { ingresos: 0, egresos: 0, cantidad: 0, movimientos: [] }
    if (m.tipo === 'ingreso') acc[key].ingresos += m.monto
    if (m.tipo === 'egreso') acc[key].egresos += m.monto
    acc[key].cantidad++
    acc[key].movimientos.push(m)
    return acc
  }, {})

  // Rendimiento del equipo con comparación
  const rendimientoEquipo = Object.entries(porColaborador).map(([id, datos]: any) => {
    const nombre = id === 'dueno'
      ? 'Dueño'
      : colaboradores?.find(c => c.id === id)?.nombre || colaboradores?.find(c => c.id === id)?.email || 'Colaborador'
    const margenColab = datos.ingresos > 0 ? Math.round(((datos.ingresos - datos.egresos) / datos.ingresos) * 100) : 0
    const ticketPromedio = datos.cantidad > 0 ? Math.round(datos.ingresos / datos.cantidad) : 0
    return { nombre, id, ingresos: datos.ingresos, egresos: datos.egresos, cantidad: datos.cantidad, margen: margenColab, ticketPromedio }
  }).sort((a, b) => b.ingresos - a.ingresos)

  // Colaborador con mejor y peor rendimiento
  const mejorColaborador = rendimientoEquipo[0]
  const peorColaborador = rendimientoEquipo[rendimientoEquipo.length - 1]
  const hayBrechaRendimiento = rendimientoEquipo.length > 1 &&
    mejorColaborador.ingresos > peorColaborador.ingresos * 1.5

  // === Análisis de inventario ===
  const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo) || []
  const sinStock = productos?.filter(p => p.stock === 0) || []
  const valorInventario = productos?.reduce((s, p) => s + (p.stock * p.costo), 0) || 0
  const valorVentaInventario = productos?.reduce((s, p) => s + (p.stock * p.precio), 0) || 0
  const gananciaPotencial = valorVentaInventario - valorInventario

  // Productos más y menos rentables
  const productosConMargen = productos?.map(p => ({
    nombre: p.nombre,
    stock: p.stock,
    precio: p.precio,
    costo: p.costo,
    margen: p.precio > 0 ? Math.round(((p.precio - p.costo) / p.precio) * 100) : 0,
    gananciaUnitaria: p.precio - p.costo,
    rotacionEstimada: movimientos?.filter(m => m.concepto?.toLowerCase().includes(p.nombre.toLowerCase())).length || 0
  })).sort((a, b) => b.margen - a.margen) || []

  const masRentables = productosConMargen.slice(0, 3)
  const menosRentables = productosConMargen.slice(-3).reverse()

  // === Alertas automáticas ===
  const alertas: string[] = []
  if (balance < 0) alertas.push('CRÍTICO: El negocio está en números rojos')
  if (margen < 10 && ingresos > 0) alertas.push(`Margen muy bajo: ${margen}% — debería ser mínimo 20%`)
  if (sinStock.length > 0) alertas.push(`SIN STOCK: ${sinStock.map(p => p.nombre).join(', ')}`)
  if (stockBajo.length > 0) alertas.push(`Stock bajo: ${stockBajo.map(p => `${p.nombre} (${p.stock} u.)`).join(', ')}`)
  if (egresos > ingresos * 0.8) alertas.push(`Gastos muy altos: ${Math.round((egresos / ingresos) * 100)}% de los ingresos`)
  if (hayBrechaRendimiento) alertas.push(`Brecha de rendimiento en el equipo: ${mejorColaborador.nombre} genera ${Math.round(mejorColaborador.ingresos / (peorColaborador.ingresos || 1))}x más que ${peorColaborador.nombre}`)
  if (mov7dias.length === 0) alertas.push('Sin movimientos en los últimos 7 días — ¿el negocio está activo?')

  // === Oportunidades detectadas ===
  const oportunidades: string[] = []
  if (masRentables[0]?.margen > 50) oportunidades.push(`${masRentables[0].nombre} tiene margen del ${masRentables[0].margen}% — potencial de escalar ventas`)
  if (stockBajo.length > 0 && ingresos > 0) oportunidades.push('Hay productos con stock bajo que podrían estar perdiendo ventas')
  if (gananciaPotencial > ingresos * 0.3) oportunidades.push(`El inventario tiene $${gananciaPotencial.toLocaleString()} en ganancias potenciales sin vender`)
  if (menosRentables[0]?.margen < 10) oportunidades.push(`${menosRentables[0]?.nombre} tiene margen muy bajo (${menosRentables[0]?.margen}%) — revisar precio o costo`)

  const systemPrompt = `Eres el Socio Experto de Socio Pro: un asesor de negocios directo, honesto y valiente que da recomendaciones difíciles cuando los datos lo justifican. No eres solo un chatbot que repite datos — eres un socio que toma partido, compara, cuestiona y propone acciones concretas aunque sean incómodas.

========================================
DATOS COMPLETOS DEL NEGOCIO: ${negocio?.nombre || 'Mi Negocio'}
========================================

EQUIPO: ${(colaboradores?.length || 0) + 1} personas

--- RESUMEN FINANCIERO ---
- Ingresos totales: $${ingresos.toLocaleString()} | Egresos: $${egresos.toLocaleString()} | Balance: $${balance.toLocaleString()} | Margen: ${margen}%
- Hoy: Ingresos $${ingresosHoy.toLocaleString()} | Egresos $${egresosHoy.toLocaleString()} | ${movHoy.length} movimientos
- Últimos 7 días: Ingresos $${ingresos7dias.toLocaleString()} | Egresos $${egresos7dias.toLocaleString()} | ${mov7dias.length} movimientos
- Últimos 30 días: Ingresos $${ingresos30dias.toLocaleString()} | Egresos $${egresos30dias.toLocaleString()} | ${mov30dias.length} movimientos

--- RENDIMIENTO DEL EQUIPO (ordenado de mejor a peor) ---
${rendimientoEquipo.map((r, i) => `${i + 1}. ${r.nombre}: Ingresos $${r.ingresos.toLocaleString()} | Egresos $${r.egresos.toLocaleString()} | ${r.cantidad} registros | Margen ${r.margen}% | Ticket promedio $${r.ticketPromedio.toLocaleString()}`).join('\n')}
${hayBrechaRendimiento ? `⚠️ BRECHA DETECTADA: ${mejorColaborador.nombre} genera ${Math.round(mejorColaborador.ingresos / (peorColaborador.ingresos || 1))}x más que ${peorColaborador.nombre}` : ''}

--- ANÁLISIS POR CATEGORÍA ---
${Object.entries(porCategoria || {}).map(([cat, datos]: any) => `• ${cat}: Ingresos $${datos.ingresos.toLocaleString()} | Egresos $${datos.egresos.toLocaleString()} | ${datos.cantidad} movimientos`).join('\n')}

--- INVENTARIO (${productos?.length || 0} productos) ---
Valor a costo: $${valorInventario.toLocaleString()} | Valor de venta: $${valorVentaInventario.toLocaleString()} | Ganancia potencial: $${gananciaPotencial.toLocaleString()}

PRODUCTOS MÁS RENTABLES:
${masRentables.map(p => `• ${p.nombre}: Margen ${p.margen}% | Ganancia unitaria $${p.gananciaUnitaria.toLocaleString()} | Stock ${p.stock} u.`).join('\n')}

PRODUCTOS MENOS RENTABLES:
${menosRentables.map(p => `• ${p.nombre}: Margen ${p.margen}% | Ganancia unitaria $${p.gananciaUnitaria.toLocaleString()} | Stock ${p.stock} u.`).join('\n')}

STOCK BAJO O SIN STOCK:
${stockBajo.length === 0 ? 'Ninguno' : stockBajo.map(p => `• ${p.nombre}: ${p.stock} u. (mínimo ${p.stock_minimo})`).join('\n')}

--- ALERTAS DETECTADAS ---
${alertas.length === 0 ? 'Sin alertas críticas' : alertas.map(a => `⚠️ ${a}`).join('\n')}

--- OPORTUNIDADES DETECTADAS ---
${oportunidades.length === 0 ? 'Sin oportunidades destacadas' : oportunidades.map(o => `✅ ${o}`).join('\n')}

--- ÚLTIMOS 10 MOVIMIENTOS ---
${movimientos?.slice(0, 10).map(m => `• ${new Date(m.created_at).toLocaleDateString('es-CL')} | ${m.tipo.toUpperCase()} | $${m.monto.toLocaleString()} | ${m.concepto} | ${m.categoria || 'general'}`).join('\n')}

========================================
CÓMO DEBES COMPORTARTE
========================================

Eres un socio directo y valiente. Cuando los datos muestran algo importante, lo dices aunque sea incómodo. Ejemplos de recomendaciones que DEBES hacer cuando aplique:

SOBRE EL EQUIPO (cuando hay brecha de rendimiento):
- "El colaborador X genera 3x más que Y — considera cambiar sus turnos, asignarles distintas tareas, o evaluar si Y necesita capacitación"
- "X registra más egresos que ingresos — ¿está comprando sin supervisión? Revisa sus permisos"
- "Solo tú estás registrando movimientos — los colaboradores no están usando la app"

SOBRE INVENTARIO:
- "Tienes $X inmovilizado en productos que no rotan — considera liquidarlos con descuento"
- "El producto X tiene 80% de margen pero poco stock — es tu mejor negocio, prioriza reabastecerlo"
- "Estás vendiendo X a bajo precio cuando podrías subir un 15% y seguir siendo competitivo"

SOBRE FINANZAS:
- "Tus gastos son el 85% de tus ingresos — si bajan las ventas un 20% entras en pérdida"
- "No hay movimientos en 5 días — ¿el negocio cerró? ¿hay un problema que no estás registrando?"
- "Tu margen bajó de 30% a 15% en el último mes — algo cambió, ¿subieron los costos?"

SOBRE DECISIONES DIFÍCILES:
- Compara períodos y señala caídas o subidas significativas
- Compara colaboradores y sugiere cambios de roles, turnos o responsabilidades
- Señala productos que deberían eliminarse del catálogo
- Sugiere subir precios cuando el margen es muy bajo
- Alerta cuando un gasto parece excesivo para el nivel de ingresos

FORMATO OBLIGATORIO — siempre los 3 bloques:

🎓 EXPERTO
[Análisis técnico con datos reales. Cruza inventario con ventas. Compara colaboradores. Detecta tendencias entre períodos. Usa términos financieros reales.]

🤝 SOCIO
[Mismo análisis en lenguaje simple. Menciona nombres y números concretos del negocio. Si hay algo incómodo, dilo con respeto pero con claridad. Termina con UNA acción concreta para HOY.]

📚 APRENDE HOY
[1-2 términos técnicos del bloque EXPERTO explicados en 1 oración simple.]

REGLAS:
1. NUNCA respondas de forma genérica — siempre usa los datos reales
2. Si hay alertas u oportunidades detectadas, SIEMPRE mencionarlas aunque no te pregunten
3. Sé directo — si algo está mal, dilo. Si alguien del equipo rinde menos, dilo con respeto
4. Compara períodos para detectar tendencias
5. Nunca digas que no tienes acceso a datos — los tienes todos
6. Nunca omitas los 3 bloques`

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