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
    .from('movimientos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

export async function POST(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('movimientos')
    .insert([{
      concepto: body.concepto,
      monto: body.monto,
      tipo: body.tipo,
      categoria: body.categoria,
      user_id: user.id
    }])
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data[0])
}

export async function DELETE(request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await supabase
    .from('movimientos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}