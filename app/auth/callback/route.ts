import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeNextPath } from '@/lib/safe-next-path'

/**
 * Callback OAuth — Supabase redirige aquí después de autenticar con Google.
 * Intercambia el `code` por una sesión y redirige al usuario al home (o a `next`).
 *
 * URL esperada: /auth/callback?code=<code>&next=/dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (!code) {
    // Si no hay código, algo salió mal — redirigir al login con error
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] Error intercambiando código:', error.message)
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_exchange_failed`)
  }

  // Redirigir al destino original (o al home)
  return NextResponse.redirect(`${origin}${next}`)
}
