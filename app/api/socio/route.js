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

  // ✅ Obtiene negocio del usuario
  const { data: negocio } = await admin
    .from('negocios')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  // ✅ Obtiene colaboradores
  const { data: colaboradores } = await admin
    .from('colaboradores')
    .select('id, nombre, email, permisos, estado')
    .eq('negocio_id', negocio?.id || '')

  // ✅ Obtiene todos los movimientos del negocio
  const { data: movimientos } = await admin
    .from('movimientos')
    .select('*')
    .eq('negocio_id', negocio?.id || '')
    .order('created_at', { ascending: false })
    .limit(200)

  // ✅ Obtiene inventario completo
  const { data: productos } = await admin
    .from('productos')
    .select('*')
    .eq('user_id', user.id)
    .order('nombre', { ascending: true })

  // === Análisis de movimientos ===
  const ingresos = movimientos?.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0) || 0
  const egresos = movimientos?.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0) || 0
  const balance = ingresos - egresos
  const margen = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0

  // Movimientos de hoy
  const hoy = new Date().toLocaleDateString('es-CL')
  const movHoy = movimientos?.filter(m =>
    new Date(m.created_at).toLocaleDateString('es-CL') === hoy
  ) || []
  const ingresosHoy = movHoy.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosHoy = movHoy.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Movimientos últimos 7 días
  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const mov7dias = movimientos?.filter(m => new Date(m.created_at) >= hace7dias) || []
  const ingresos7dias = mov7dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos7dias = mov7dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Movimientos últimos 30 días
  const hace30dias = new Date()
  hace30dias.setDate(hace30dias.getDate() - 30)
  const mov30dias = movimientos?.filter(m => new Date(m.created_at) >= hace30dias) || []
  const ingresos30dias = mov30dias.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos30dias = mov30dias.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  // Análisis por categoría
  const porCategoria = movimientos?.reduce((acc: any, m) => {
    const cat = m.categoria || 'general'
    if (!acc[cat]) acc[cat] = { ingresos: 0, egresos: 0, cantidad: 0 }
    if (m.tipo === 'ingreso') acc[cat].ingresos += m.monto
    if (m.tipo === 'egreso') acc[cat].egresos += m.monto
    acc[cat].cantidad++
    return acc
  }, {})

  // Análisis por colaborador
  const porColaborador = movimientos?.reduce((acc: any, m) => {
    const key = m.colaborador_id || 'dueno'
    if (!acc[key]) acc[key] = { ingresos: 0, egresos: 0, cantidad: 0 }
    if (m.tipo === 'ingreso') acc[key].ingresos += m.monto
    if (m.tipo === 'egreso') acc[key].egresos += m.monto
    acc[key].cantidad++
    return acc
  }, {})

  // Mapea nombres de colaboradores
  const rendimientoEquipo = Object.entries(porColaborador).map(([id, datos]: any) => {
    if (id === 'dueno') return { nombre: 'Dueño', ...datos }
    const colab = colaboradores?.find(c => c.id === id)
    return { nombre: colab?.nombre || colab?.email || 'Colaborador', ...datos }
  })

  // === Análisis de inventario ===
  const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo) || []
  const sinStock = productos?.filter(p => p.stock === 0) || []
  const valorInventario = productos?.reduce((s, p) => s + (p.stock * p.costo), 0) || 0
  const valorVentaInventario = productos?.reduce((s, p) => s + (p.stock * p.precio), 0) || 0
  const gananciaPotenical = valorVentaInventario - valorInventario

  // Productos más rentables (mayor margen)
  const productosConMargen = productos?.map(p => ({
    nombre: p.nombre,
    stock: p.stock,
    precio: p.precio,
    costo: p.costo,
    margen: p.precio > 0 ? Math.round(((p.precio - p.costo) / p.precio) * 100) : 0,
    ganancia_unitaria: p.precio - p.costo
  })).sort((a, b) => b.margen - a.margen) || []

  // === Alertas automáticas ===
  const alertas = []
  if (balance < 0) alertas.push('ALERTA CRÍTICA: El negocio está en números rojos')
  if (margen < 10 && ingresos > 0) alertas.push('Margen muy bajo — menos del 10%')
  if (sinStock.length > 0) alertas.push(`${sinStock.length} producto(s) SIN STOCK: ${sinStock.map(p => p.nombre).join(', ')}`)
  if (stockBajo.length > 0) alertas.push(`${stockBajo.length} producto(s) con stock bajo: ${stockBajo.map(p => `${p.nombre} (${p.stock} u.)`).join(', ')}`)
  if (movimientos && movimientos.length < 5) alertas.push('Pocos movimientos registrados — los análisis pueden no ser precisos')
  if (egresos > ingresos * 0.8) alertas.push('Los gastos superan el 80% de los ingresos — revisar costos')

  const systemPrompt = `Eres el Socio Experto de Socio Pro, un asesor financiero y de negocios experto para emprendedores latinoamericanos. Tienes acceso COMPLETO a todos los datos del negocio y debes analizarlos profundamente para dar respuestas útiles, alertas y recomendaciones concretas.

========================================
DATOS COMPLETOS DEL NEGOCIO
========================================

NEGOCIO: ${negocio?.nombre || 'Mi Negocio'}
EQUIPO: ${(colaboradores?.length || 0) + 1} personas (1 dueño + ${colaboradores?.length || 0} colaboradores)

--- RESUMEN FINANCIERO TOTAL ---
- Ingresos totales: $${ingresos.toLocaleString()}
- Egresos totales: $${egresos.toLocaleString()}
- Balance total: $${balance.toLocaleString()}
- Margen: ${margen}%
- Total movimientos registrados: ${movimientos?.length || 0}

--- HOY ---
- Ingresos hoy: $${ingresosHoy.toLocaleString()}
- Egresos hoy: $${egresosHoy.toLocaleString()}
- Balance hoy: $${(ingresosHoy - egresosHoy).toLocaleString()}
- Movimientos hoy: ${movHoy.length}

--- ÚLTIMOS 7 DÍAS ---
- Ingresos: $${ingresos7dias.toLocaleString()}
- Egresos: $${egresos7dias.toLocaleString()}
- Balance: $${(ingresos7dias - egresos7dias).toLocaleString()}
- Movimientos: ${mov7dias.length}

--- ÚLTIMOS 30 DÍAS ---
- Ingresos: $${ingresos30dias.toLocaleString()}
- Egresos: $${egresos30dias.toLocaleString()}
- Balance: $${(ingresos30dias - egresos30dias).toLocaleString()}
- Movimientos: ${mov30dias.length}

--- ANÁLISIS POR CATEGORÍA ---
${Object.entries(porCategoria || {}).map(([cat, datos]: any) =>
  `• ${cat}: Ingresos $${datos.ingresos.toLocaleString()} | Egresos $${datos.egresos.toLocaleString()} | ${datos.cantidad} movimientos`
).join('\n')}

--- RENDIMIENTO DEL EQUIPO ---
${rendimientoEquipo.map(r =>
  `• ${r.nombre}: Ingresos $${r.ingresos.toLocaleString()} | Egresos $${r.egresos.toLocaleString()} | ${r.cantidad} registros`
).join('\n')}

--- INVENTARIO COMPLETO (${productos?.length || 0} productos) ---
${productosConMargen.map(p =>
  `• ${p.nombre}: Stock ${p.stock} u. | Precio $${p.precio.toLocaleString()} | Costo $${p.costo.toLocaleString()} | Margen ${p.margen}% | Ganancia unitaria $${p.ganancia_unitaria.toLocaleString()}`
).join('\n')}

VALOR TOTAL INVENTARIO (a costo): $${valorInventario.toLocaleString()}
VALOR POTENCIAL DE VENTA: $${valorVentaInventario.toLocaleString()}
GANANCIA POTENCIAL SI SE VENDE TODO: $${gananciaPotenical.toLocaleString()}

--- PRODUCTOS CON STOCK BAJO O SIN STOCK ---
${stockBajo.length === 0 ? 'Ninguno — todos los productos tienen stock suficiente' :
  stockBajo.map(p => `• ${p.nombre}: ${p.stock} u. (mínimo: ${p.stock_minimo})`).join('\n')}

${sinStock.length > 0 ? `SIN STOCK (urgente): ${sinStock.map(p => p.nombre).join(', ')}` : ''}

--- ALERTAS DETECTADAS AUTOMÁTICAMENTE ---
${alertas.length === 0 ? 'Sin alertas críticas detectadas' : alertas.map(a => `⚠️ ${a}`).join('\n')}

--- ÚLTIMOS 10 MOVIMIENTOS ---
${movimientos?.slice(0, 10).map(m =>
  `• ${new Date(m.created_at).toLocaleDateString('es-CL')} | ${m.tipo.toUpperCase()} | $${m.monto.toLocaleString()} | ${m.concepto} | ${m.categoria || 'general'}`
).join('\n')}

========================================
INSTRUCCIONES DE COMPORTAMIENTO
========================================

SIEMPRE responde en este formato exacto con los 3 bloques:

🎓 EXPERTO
[Análisis técnico y profesional usando los datos reales del negocio. Usa términos financieros: margen, rotación de inventario, flujo de caja, rentabilidad, punto de equilibrio, etc. Cruza información entre inventario y ventas cuando sea relevante.]

🤝 SOCIO
[Misma información en lenguaje simple y cotidiano. Como un amigo que entiende de negocios. Menciona números concretos del negocio. Termina SIEMPRE con UNA acción concreta y específica que puede hacer HOY.]

📚 APRENDE HOY
[Define 1-2 términos técnicos que usaste en el bloque EXPERTO. Formato: **Término**: definición en 1 oración simple.]

REGLAS CRÍTICAS:
1. SIEMPRE usa los datos reales del negocio en tus respuestas — nunca respondas de forma genérica
2. Si detectas alertas o problemas en los datos, MENCIÓNALOS aunque no te pregunten
3. Cruza información: relaciona inventario con ventas, colaboradores con rendimiento, categorías con márgenes
4. Si el inventario tiene productos con stock bajo, SIEMPRE menciónalo
5. Compara períodos (hoy vs 7 días vs 30 días) para detectar tendencias
6. Termina el bloque SOCIO con una acción concreta y medible
7. Nunca digas que no tienes acceso a los datos — los tienes todos
8. Nunca omitas ninguno de los 3 bloques`

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