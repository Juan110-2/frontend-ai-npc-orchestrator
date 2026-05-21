'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogIn, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const { loginWithGoogle, sendMagicLink } = useAuth()

  const [email, setEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const [loadingMagic, setLoadingMagic] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const [nextPath, setNextPath] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextPath(params.get('next') || '/')
    const error = params.get('error')
    if (error === 'oauth_missing_code') toast.error('Error en el inicio de sesión con Google')
    if (error === 'oauth_exchange_failed') toast.error('No se pudo completar la autenticación con Google')
  }, [])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoadingMagic(true)
      await sendMagicLink(email)
      setMagicSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el enlace')
    } finally {
      setLoadingMagic(false)
    }
  }

  const handleGoogle = async () => {
    try {
      setLoadingGoogle(true)
      await loginWithGoogle()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error con Google')
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">

        {/* Header Univalle */}
        <div className="bg-white px-8 pt-8 pb-4 text-center border-b">
          <div className="flex items-center justify-center gap-3 mb-1">
            {/* Escudo Univalle simplificado */}
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

          {/* Caja informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-gray-700 leading-relaxed">
            Si tu correo es institucional{' '}
            <span className="font-semibold">(correounivalle.edu.co)</span> puedes{' '}
            <span className="font-semibold">acceder directamente</span> por medio del botón{' '}
            <span className="font-semibold">"Iniciar sesión con Google"</span>.<br />
            En caso contrario, ingresa tu correo y te enviaremos{' '}
            <span className="font-semibold">un enlace directo para acceder al sistema</span>.
          </div>

          {/* Magic link enviado */}
          {magicSent ? (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-800">Revisa tu correo</p>
              <p className="text-sm text-gray-500">
                Enviamos un enlace de acceso a <strong>{email}</strong>.<br />
                Haz clic en él para ingresar a la plataforma.
              </p>
              <button
                onClick={() => { setMagicSent(false); setEmail('') }}
                className="text-sm text-[color:var(--app-panel-header-color)] underline hover:opacity-80"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <>
              {/* Formulario magic link */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={loadingMagic} className="w-full btn-principal">
                  <Send className="mr-2 h-4 w-4" />
                  {loadingMagic ? 'Enviando...' : 'Enviar a mi correo un acceso al sistema'}
                </Button>
              </form>

              {/* Botón credenciales */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/auth/credenciales${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`)}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión con credenciales
              </Button>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={loadingGoogle}
              >
                <GoogleIcon />
                <span className="ml-2">
                  {loadingGoogle ? 'Redirigiendo...' : 'Iniciar sesión con Google'}
                </span>
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-8 py-4 text-center text-xs text-gray-500 space-y-1">
          <p>Universidad del Valle, Copyright © {new Date().getFullYear()} PsicoSim.</p>
          <p>
            Cualquier problema con el sistema por favor informar a:{' '}
            <a
              href="mailto:juanjosejaramillo203@gmail.com"
              className="text-[color:var(--app-panel-header-color)] underline hover:opacity-80"
            >
              soporte@psicosim.edu.co
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
