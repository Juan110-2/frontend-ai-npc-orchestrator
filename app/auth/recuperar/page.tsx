'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsLoading(false)
    toast.success('Enlace de recuperacion enviado (modo demo)')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar contrasena</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos instrucciones para restablecer acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Correo</Label>
              <Input
                id="recovery-email"
                type="email"
                placeholder="tu.correo@universidad.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Mail className="mr-2 h-4 w-4" />
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link className="inline-flex items-center gap-1 underline hover:text-foreground" href="/auth/login">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
