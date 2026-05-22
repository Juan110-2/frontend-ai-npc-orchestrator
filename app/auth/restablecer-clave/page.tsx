'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function NuevaContrasenaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setHasSession(!!data.session)
    }
    void checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Contraseña actualizada')
      router.push('/auth/credenciales')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
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
          {!hasSession ? (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ShieldCheck className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Enlace invalido o expirado</p>
                <p className="text-sm text-gray-500 mt-1">
                  Solicita un nuevo enlace de recuperacion para continuar.
                </p>
              </div>
              <Link
                href="/auth/recuperar-credenciales"
                className="text-sm text-[color:var(--app-panel-header-color)] underline hover:opacity-80"
              >
                Volver a recuperar contrasena
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Nueva contrasena</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define una nueva contrasena para tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Nueva contrasena
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                    Confirmar contrasena
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repite la contrasena"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="mt-1"
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full btn-principal">
                  <KeyRound className="mr-2 h-4 w-4" />
                  {isLoading ? 'Actualizando...' : 'Actualizar contrasena'}
                </Button>
              </form>
            </>
          )}

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesion
            </Link>
          </div>
        </div>

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
