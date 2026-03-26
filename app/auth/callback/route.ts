import { createServerClient } from '@supabase/ssr'
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

        // ✅ maybeSingle() no lanza error si no encuentra nada
        const { data: colaborador } = await supabase
          .from('colaboradores')
          .select('id, user_id, estado')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()

        if (colaborador) {
          // ✅ Actualiza siempre — tanto pendiente como activo
          const { error: updateError } = await supabase
            .from('colaboradores')
            .update({
              user_id: user.id,
              estado: 'activo'
            })
            .eq('id', colaborador.id)

          // Si hubo error al actualizar, lo logueamos pero no bloqueamos
          if (updateError) {
            console.error('Error actualizando colaborador:', updateError.message)
          }

          // Colaborador vinculado — va directo al inicio
          return NextResponse.redirect(`${origin}/`)
        }

        // ✅ Si no es colaborador, verifica si ya tiene negocio
        const { data: negocio } = await supabase
          .from('negocios')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        // Si no tiene negocio, lo crea
        if (!negocio) {
          await supabase
            .from('negocios')
            .insert([{ owner_id: user.id, nombre: 'Mi Negocio' }])
        }
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}