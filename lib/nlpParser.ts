export function parsearMovimiento(texto: string) {
  const t = texto.toLowerCase().trim()

  const palabrasIngreso = /vend[ií]|cobr[eé]|ingres[eé]|gan[eé]|recib[ií]|pagaron|vendido|cobrado|venta/
  const palabrasEgreso = /compr[eé]|gast[eé]|pagu[eé]|cost[oó]|compramos|gasto|debo/

  let tipo = 'egreso'
  if (palabrasIngreso.test(t) && !palabrasEgreso.test(t)) tipo = 'ingreso'

  let monto = 0

  const palo = t.match(/(\d+(?:\.\d+)?)\s*palos?/)
  if (palo) monto = parseFloat(palo[1]) * 1000000

  const lucas = t.match(/(\d+(?:\.\d+)?)\s*lucas/)
  if (lucas && monto === 0) monto = parseFloat(lucas[1]) * 1000

  const luca = t.match(/(\d+(?:\.\d+)?)\s*luca\b/)
  if (luca && monto === 0) monto = parseFloat(luca[1]) * 1000

  const kmil = t.match(/(\d+(?:\.\d+)?)\s*k\b/)
  if (kmil && monto === 0) monto = parseFloat(kmil[1]) * 1000

  const mil = t.match(/(\d+(?:\.\d+)?)\s*mil\b/)
  if (mil && monto === 0) monto = parseFloat(mil[1]) * 1000

  const directo = t.match(/\$?(\d{2,})/)
  if (directo && monto === 0) monto = parseFloat(directo[1])

  monto = Math.round(monto)

  let categoria = 'general'
  if (/comida|completo|empanada|pan|caf[eé]|once|colaci[oó]n|cazuela|helado/.test(t)) categoria = 'alimentación'
  if (/harina|aceite|az[uú]car|sal|ingrediente|materia/.test(t)) categoria = 'insumos'
  if (/arriendo|luz|agua|gas|internet|tel[eé]fono|cuenta/.test(t)) categoria = 'servicios'
  if (/sueldo|empleado|trabajador|personal/.test(t)) categoria = 'personal'
  if (/uber|taxi|micro|bus|bencina|gasolina|colectivo/.test(t)) categoria = 'transporte'
  if (/publicidad|marketing|instagram|facebook|tiktok/.test(t)) categoria = 'marketing'

  return { concepto: texto.trim(), monto, tipo, categoria }
}