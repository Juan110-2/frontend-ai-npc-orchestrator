'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, LogIn, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { safeNextPath } from '@/lib/safe-next-path'
import { toast } from 'sonner'

export default function CredencialesPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [nextPath, setNextPath] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextPath(safeNextPath(params.get('next')))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      await login(email, password)
      toast.success('Sesión iniciada')
      router.push(nextPath)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Correo o contraseña incorrectos')
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
              <p className="text-xs text-gray-500">PsicoSim · Simulación Clínica Virtual</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Iniciar sesión con credenciales</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa tu correo y contraseña para acceder.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.correo@universidad.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full btn-principal">
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <Button
            asChild
            type="button"
            variant="outline"
            className="w-full border-[var(--app-panel-header-color)] text-[color:var(--app-panel-header-color)] hover:text-[color:var(--app-panel-header-color)] active:text-[color:var(--app-panel-header-color)] hover:bg-[var(--app-panel-header-soft-color)] active:bg-[var(--app-panel-header-soft-color)] transition-colors"
          >
            <Link href="/auth/recuperar-credenciales">
              ¿Ayuda, no tengo/conozco mi contraseña?
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              const supabase = createClient()
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              })
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Iniciar sesión con Google
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
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
