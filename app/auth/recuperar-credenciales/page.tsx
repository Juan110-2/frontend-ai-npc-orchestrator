'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/restablecer-clave`,
      })
      if (error) throw new Error(error.message)
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el correo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">

        {/* Header Univalle */}
        <div className="bg-white px-8 pt-8 pb-4 text-center border-b">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-[var(--app-panel-header-color)]">
              <span className="text-white font-bold text-lg">UV</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-[color:var(--app-panel-header-color)] leading-tight">Universidad del Valle</h1>
              <p className="text-xs text-gray-500">PsicoSim — Simulación Clínica Virtual</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Revisa tu correo</p>
                <p className="text-sm text-gray-500 mt-1">
                  Enviamos las instrucciones para restablecer tu contraseña a{' '}
                  <strong>{email}</strong>.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm text-[color:var(--app-panel-header-color)] underline hover:opacity-80"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Recuperar contraseña</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="recovery-email" className="text-sm font-medium text-gray-700">
                    Correo electrónico
                  </Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu.correo@universidad.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full btn-principal">
                  <Mail className="mr-2 h-4 w-4" />
                  {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>
            </>
          )}

          <div className="text-center">
            <Link
              href="/auth/credenciales"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-8 py-4 text-center text-xs text-gray-500 space-y-1">
          <p>Universidad del Valle, Copyright © {new Date().getFullYear()} PsicoSim.</p>
          <p>
            Cualquier problema con el sistema por favor informar a:{' '}
            <a href="mailto:soporte@psicosim.edu.co" className="text-[color:var(--app-panel-header-color)] underline hover:opacity-80">
              soporte@psicosim.edu.co
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
