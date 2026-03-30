'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Brain, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [nextPath, setNextPath] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextPath(params.get('next') || '/')
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setIsLoading(true)
      await login(email, password)
      toast.success('Sesion iniciada')
      router.push(nextPath)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Iniciar sesion</CardTitle>
          <CardDescription>Accede a la plataforma de simulacion situacional</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.correo@universidad.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link className="underline hover:text-foreground" href="/auth/recuperar">
              Olvide mi contrasena
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
