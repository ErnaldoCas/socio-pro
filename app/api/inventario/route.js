import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('user_id', user.id)
    .order('nombre', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

export async function POST(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: body.nombre,
      stock: Number(body.stock) || 0,
      precio: Number(body.precio) || 0,
      costo: Number(body.costo) || 0,
      stock_minimo: Number(body.stock_minimo) || 5,
      categoria: body.categoria || 'general',
      user_id: user.id
    }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}

export async function PUT(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

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
    .eq('user_id', user.id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}