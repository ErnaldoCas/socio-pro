export function parsearMovimiento(texto: string) {
  const t = texto.toLowerCase().trim()

  const palabrasIngreso = /vend[ií]|cobr[eé]|ingres[eé]|gan[eé]|recib[ií]|pagaron|vendido|cobrado|venta|me pagaron|me dieron|entraron|cayeron|cayó|llegaron|llegó|junt[eé]|sac[aé]|saqué/
  const palabrasEgreso = /compr[eé]|gast[eé]|pagu[eé]|cost[oó]|compramos|gasto|debo|sal[ií]o|sali[oó]|fuero|fueron|desembolso|perd[ií]|me cost[oó]|me salió|tuve que pagar|ocup[eé]|saqué para/

  let tipo = 'egreso'
  if (palabrasIngreso.test(t) && !palabrasEgreso.test(t)) tipo = 'ingreso'
  if (!palabrasIngreso.test(t) && !palabrasEgreso.test(t)) {
    if (/completo|empanada|café|bebida|jugo|pan|helado|schop|palta/.test(t)) tipo = 'ingreso'
  }

  let monto = 0

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

  if (/medio palo/.test(t) && monto === 0) monto = 500000
  if (/media luca/.test(t) && monto === 0) monto = 500

  const directo = t.match(/\$?\s*(\d{2,})/)
  if (directo && monto === 0) monto = parseFloat(directo[1])

  monto = Math.round(monto)

  // Limpia el concepto — saca verbos, artículos y montos
  let concepto = texto.trim()

  concepto = concepto
    .replace(/\$?\s*\d+(?:[.,]\d+)?\s*(?:palos?|lucas?|luca|mil|k)\b/gi, '')
    .replace(/\$?\s*\d{2,}/g, '')
    .trim()

  concepto = concepto
    .replace(/^(vend[ií]|cobr[eé]|ingres[eé]|gan[eé]|recib[ií]|compr[eé]|gast[eé]|pagu[eé]|me pagaron|me dieron|tuve que pagar|pago de|pago del|pago a|compra de|compra del|venta de|venta del)\s*/i, '')
    .trim()

  concepto = concepto
    .replace(/^(un |una |unos |unas |el |la |los |las |de |del |al )/i, '')
    .trim()

  if (concepto.length < 2) {
    concepto = texto.trim()
      .replace(/\$?\s*\d+(?:[.,]\d+)?\s*(?:palos?|lucas?|luca|mil|k)\b/gi, '')
      .replace(/\$?\s*\d{2,}/g, '')
      .trim()
  }

  concepto = concepto.charAt(0).toUpperCase() + concepto.slice(1)

  let categoria = 'general'
  const tConcepto = concepto.toLowerCase()
  if (/completo|empanada|pan|caf[eé]|once|colaci[oó]n|cazuela|helado|marraqueta|schop|sopaipilla|pollo|papas|ensalada|sandwich|hamburguesa|pizza/.test(tConcepto)) categoria = 'alimentación'
  if (/harina|aceite|az[uú]car|sal|ingrediente|materia|insumo|envase|bolsa|caja|servilleta/.test(tConcepto)) categoria = 'insumos'
  if (/arriendo|luz|agua|gas|internet|tel[eé]fono|cuenta|boleta|factura|mensualidad/.test(tConcepto)) categoria = 'servicios'
  if (/sueldo|empleado|trabajador|personal|colaborador|honorario/.test(tConcepto)) categoria = 'personal'
  if (/uber|taxi|micro|bus|bencina|gasolina|colectivo|pasaje|estacionamiento/.test(tConcepto)) categoria = 'transporte'
  if (/publicidad|marketing|instagram|facebook|tiktok|redes|pauta|diseño/.test(tConcepto)) categoria = 'marketing'

  return { concepto, monto, tipo, categoria }
}