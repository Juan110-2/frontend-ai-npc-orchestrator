'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'student' | 'teacher' | 'admin'

type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  session: Session | null
  userEmail: string | null
  userRole: UserRole
  // Retorna el access_token para enviarlo al backend FastAPI
  getAccessToken: () => Promise<string | null>
  login: (email: string, password: string, role?: UserRole) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [isLoading, setIsLoading] = useState(true)

  // Extraer el rol desde los metadatos del usuario de Supabase
  const extractRole = (u: User | null): UserRole => {
    const raw = u?.user_metadata?.role
    if (raw === 'teacher' || raw === 'admin') return raw
    return 'student'
  }

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setUserRole(extractRole(s?.user ?? null))
      setIsLoading(false)
    })

    // Suscribirse a cambios de sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setUserRole(extractRole(s?.user ?? null))
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (
    email: string,
    password: string,
    role: UserRole = 'student',
  ) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('Debes ingresar correo y contraseña')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Traducir errores comunes de Supabase a español
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Correo o contraseña incorrectos')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Debes confirmar tu correo antes de iniciar sesión')
      }
      throw new Error(error.message)
    }

    // El rol se actualiza via onAuthStateChange automáticamente.
    // Si el usuario no tiene rol asignado aún, actualizamos sus metadatos.
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser && !currentUser.user_metadata?.role) {
      await supabase.auth.updateUser({ data: { role } })
    }
  }, [supabase])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session: s } } = await supabase.auth.getSession()
    return s?.access_token ?? null
  }, [supabase])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isLoading,
      user,
      session,
      userEmail: user?.email ?? null,
      userRole,
      getAccessToken,
      login,
      logout,
    }),
    [user, session, userRole, isLoading, getAccessToken, login, logout],
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
