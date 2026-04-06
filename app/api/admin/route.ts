import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const ADMIN_EMAIL = 'ercastros@gmail.com'

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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener todos los negocios con el email del dueño desde auth.users
  const { data: negocios } = await admin
    .from('negocios')
    .select('id, nombre, nombre_dueno, plan, created_at, owner_id')
    .order('created_at', { ascending: false })

  if (!negocios) return Response.json([])

  // Obtener emails desde auth.users para cada owner_id
  const ownerIds = negocios.map(n => n.owner_id)
  const { data: { users } } = await admin.auth.admin.listUsers()

  const emailPorId: Record<string, string> = {}
  users?.forEach(u => { emailPorId[u.id] = u.email || '' })

  const resultado = negocios.map(n => ({
    ...n,
    email: emailPorId[n.owner_id] || 'Sin email',
  }))

  return Response.json(resultado)
}