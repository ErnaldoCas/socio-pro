import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {

        // ✅ Admin client — saltea RLS completamente
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Busca colaborador por email sin importar mayúsculas
        const { data: colaborador } = await admin
          .from('colaboradores')
          .select('id, user_id, estado, negocio_id')
          .ilike('email', user.email)
          .maybeSingle()

        if (colaborador) {
          // ✅ Vincula colaborador y lo pone activo
          await admin
            .from('colaboradores')
            .update({
              user_id: user.id,
              estado: 'activo'
            })
            .eq('id', colaborador.id)

          // ✅ NO crea negocio — es colaborador, no dueño
          return NextResponse.redirect(`${origin}/`)
        }

        // No es colaborador — verifica si ya tiene negocio propio
        const { data: negocio } = await admin
          .from('negocios')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        // Solo crea negocio si no tiene ninguno
        if (!negocio) {
          await admin
            .from('negocios')
            .insert([{ owner_id: user.id, nombre: 'Mi Negocio' }])
        }
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}