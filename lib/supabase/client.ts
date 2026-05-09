/**
 * Cliente Supabase para uso en el BROWSER (componentes 'use client').
 * Gestiona la sesión del usuario via cookies compartidas con el servidor.
 * Importar solo en componentes del lado del cliente.
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
