"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react"

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email) {
      setError("Por favor ingresa tu correo electronico")
      return
    }

    setIsSubmitting(true)
    const success = await requestPasswordReset(email)
    
    if (success) {
      setIsSuccess(true)
    } else {
      setError("No se pudo enviar el correo. Intenta nuevamente.")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">SimuLab</h1>
        </div>

        {/* Recovery Card */}
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Recuperar contrasena</CardTitle>
            <CardDescription>
              Ingresa tu correo y te enviaremos instrucciones para restablecer tu contrasena
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Correo enviado</p>
                  <p className="text-sm text-muted-foreground">
                    Si existe una cuenta con ese correo, recibiras instrucciones para restablecer tu contrasena.
                  </p>
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="pl-9"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>

                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
