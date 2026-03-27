export function parsearMovimiento(texto: string) {
  const t = texto.toLowerCase().trim()

  // ✅ Más palabras de ingreso en chileno
  const palabrasIngreso = /vend[ií]|cobr[eé]|ingres[eé]|gan[eé]|recib[ií]|pagaron|vendido|cobrado|venta|me pagaron|me dieron|entraron|cayeron|cayó|llegaron|llegó|junt[eé]|sac[aé]|saqué/
  // ✅ Más palabras de egreso en chileno
  const palabrasEgreso = /compr[eé]|gast[eé]|pagu[eé]|cost[oó]|compramos|gasto|debo|sal[ií]o|sali[oó]|fuero|fueron|desembolso|perd[ií]|me cost[oó]|me salió|tuve que pagar|ocup[eé]|saqué para/

  let tipo = 'egreso'
  if (palabrasIngreso.test(t) && !palabrasEgreso.test(t)) tipo = 'ingreso'
  if (!palabrasIngreso.test(t) && !palabrasEgreso.test(t)) {
    // Si no hay keyword clara, asume ingreso si menciona productos típicos de venta
    if (/completo|empanada|café|bebida|jugo|pan|helado|schop|palta/.test(t)) tipo = 'ingreso'
  }

  let monto = 0

  // ✅ Chilenismos de montos
  const palo = t.match(/(\d+(?:[.,]\d+)?)\s*palos?/)
  if (palo) monto = parseFloat(palo[1].replace(',', '.')) * 1000000

  const lucas = t.match(/(\d+(?:[.,]\d+)?)\s*lucas/)
  if (lucas && monto === 0) monto = parseFloat(lucas[1].replace(',', '.')) * 1000

  const luca = t.match(/(\d+(?:[.,]\d+)?)\s*luca\b/)
  if (luca && monto === 0) monto = parseFloat(luca[1].replace(',', '.')) * 1000

  const kmil = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/)
  if (kmil && monto === 0) monto = parseFloat(kmil[1].replace(',', '.')) * 1000

  const mil = t.match(/(\d+(?:[.,]\d+)?)\s*mil\b/)
  if (mil && monto === 0) monto = parseFloat(mil[1].replace(',', '.')) * 1000

  // Medio palo, media luca
  if (/medio palo|media luca/.test(t) && monto === 0) monto = t.includes('palo') ? 500000 : 500

  const directo = t.match(/\$?\s*(\d{2,})/)
  if (directo && monto === 0) monto = parseFloat(directo[1])

  monto = Math.round(monto)

  // ✅ Categorías con más chilenismos
  let categoria = 'general'
  if (/completo|empanada|pan|caf[eé]|once|colaci[oó]n|cazuela|helado|marraqueta|schop|sopaipilla|mote|chorrillana|lomo|pollo|papas|ensalada|sandwich|hamburguesa|pizza/.test(t)) categoria = 'alimentación'
  if (/harina|aceite|az[uú]car|sal|ingrediente|materia|insumo|envase|bolsa|caja|servilleta|palillo/.test(t)) categoria = 'insumos'
  if (/arriendo|luz|agua|gas|internet|tel[eé]fono|cuenta|boleta|factura|mensualidad/.test(t)) categoria = 'servicios'
  if (/sueldo|empleado|trabajador|personal|colaborador|honorario|pago a/.test(t)) categoria = 'personal'
  if (/uber|taxi|micro|bus|bencina|gasolina|colectivo|pasaje|estacionamiento/.test(t)) categoria = 'transporte'
  if (/publicidad|marketing|instagram|facebook|tiktok|redes|pauta|diseño|logo/.test(t)) categoria = 'marketing'
  if (/bebida|jugo|agua|cerveza|vino|pisco|schop/.test(t) && tipo === 'ingreso') categoria = 'alimentación'

  return { concepto: texto.trim(), monto, tipo, categoria }
}