export function parsearMovimiento(texto: string) {
  const t = texto.toLowerCase().trim()

  // Detectar tipo
  const palabrasIngreso = /vendí|vendi|cobré|cobre|ingresé|ingrese|gané|gane|recibí|recibi|pagaron|vendido|cobrado/
  const palabrasEgreso = /compré|compre|gasté|gaste|pagué|pague|costó|costo|compramos|gasto/

  let tipo = 'egreso'
  if (palabrasIngreso.test(t) && !palabrasEgreso.test(t)) tipo = 'ingreso'

  // Detectar monto — orden importa
  let monto = 0

  const palo = t.match(/(\d+)\s*palos?/)
  if (palo) { monto = parseInt(palo[1]) * 1000000 }

  const lucas = t.match(/(\d+)\s*lucas/)
  if (lucas && monto === 0) { monto = parseInt(lucas[1]) * 1000 }

  const luca = t.match(/(\d+)\s*luca\b/)
  if (luca && monto === 0) { monto = parseInt(luca[1]) * 1000 }

  const kmil = t.match(/(\d+)\s*(k|mil)\b/)
  if (kmil && monto === 0) { monto = parseInt(kmil[1]) * 1000 }

  const directo = t.match(/\$?(\d+)/)
  if (directo && monto === 0) { monto = parseInt(directo[1]) }

  // Detectar categoría
  let categoria = 'general'
  if (/comida|completo|empanada|pan|café|cafe|once|colacion|cazuela/.test(t)) categoria = 'alimentación'
  if (/harina|aceite|azucar|sal|ingrediente|materia prima/.test(t)) categoria = 'insumos'
  if (/arriendo|luz|agua|gas|internet|telefono/.test(t)) categoria = 'servicios'
  if (/sueldo|empleado|trabajador|personal/.test(t)) categoria = 'personal'
  if (/uber|taxi|micro|bus|bencina|gasolina|colectivo/.test(t)) categoria = 'transporte'
  if (/publicidad|marketing|instagram|facebook|tiktok/.test(t)) categoria = 'marketing'

  return { concepto: texto.trim(), monto, tipo, categoria }
}