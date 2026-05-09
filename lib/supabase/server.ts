/**
 * Cliente Supabase para uso en el SERVIDOR (Server Components, Route Handlers, middleware).
 * Lee y escribe cookies del request usando next/headers.
 * NO importar en componentes 'use client'.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // En Server Components el set de cookies puede fallar si ya se envió el header.
            // El middleware refresca la sesión para evitar que esto sea un problema.
          }
        },
      },
    },
  )
}
