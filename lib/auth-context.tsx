'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuthCookie, setAuthCookie } from '@/lib/auth'

type AuthContextValue = {
  isAuthenticated: boolean
  userEmail: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_STORAGE_KEY = 'psicosim_user_email'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const email = localStorage.getItem(AUTH_STORAGE_KEY)
      if (email) {
        setUserEmail(email)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('Debes ingresar correo y contraseña')
    }
    await new Promise((resolve) => setTimeout(resolve, 350))
    localStorage.setItem(AUTH_STORAGE_KEY, email)
    setAuthCookie()
    setUserEmail(email)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    clearAuthCookie()
    setUserEmail(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!userEmail,
      userEmail,
      isLoading,
      login,
      logout,
    }),
    [userEmail, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
