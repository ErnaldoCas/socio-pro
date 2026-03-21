import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

export async function POST(request) {
  const supabase = createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: body.nombre,
      stock: Number(body.stock) || 0,
      precio: Number(body.precio) || 0,
      costo: Number(body.costo) || 0,
      stock_minimo: Number(body.stock_minimo) || 5,
      categoria: body.categoria || 'general'
    }])
    .select()

  if (error) {
    console.error('Error Supabase:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json(data[0])
}

export async function PUT(request) {
  const supabase = createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('productos')
    .update({
      stock: Number(body.stock) || 0,
      precio: Number(body.precio) || 0,
      costo: Number(body.costo) || 0,
      stock_minimo: Number(body.stock_minimo) || 5
    })
    .eq('id', body.id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}