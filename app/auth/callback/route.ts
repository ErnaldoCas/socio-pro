import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    // Cliente normal para manejar la sesión del usuario
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

        // ✅ Cliente admin con service role — saltea RLS completamente
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Busca colaborador por email (case insensitive)
        const { data: colaborador } = await admin
          .from('colaboradores')
          .select('id, user_id, estado')
          .ilike('email', user.email)
          .maybeSingle()

        if (colaborador) {
          // ✅ Actualiza con admin — sin restricciones de RLS
          await admin
            .from('colaboradores')
            .update({
              user_id: user.id,
              estado: 'activo'
            })
            .eq('id', colaborador.id)

          return NextResponse.redirect(`${origin}/`)
        }

        // Si no es colaborador, verifica si ya tiene negocio
        const { data: negocio } = await admin
          .from('negocios')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        // Si no tiene negocio, lo crea
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