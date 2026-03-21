import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

export async function POST(request) {
  const supabase = createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('movimientos')
    .insert([{
      concepto: body.concepto,
      monto: body.monto,
      tipo: body.tipo,
      categoria: body.categoria
    }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}

export async function DELETE(request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await supabase
    .from('movimientos')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}