'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'
import { toast } from 'sonner'
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
  loginWithGoogle: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const manualLogout = useRef(false)

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [isLoading, setIsLoading] = useState(true)

  // 1. Sincronizar user/session con Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (!s) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (!s) {
        setUserRole('student')
        setIsLoading(false)
        if (event === 'SIGNED_OUT' && !manualLogout.current) {
          toast.error('Tu sesión expiró. Por favor inicia sesión de nuevo.')
          router.replace('/auth/login')
        }
        manualLogout.current = false
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Cada vez que cambia el user, obtener su rol real
  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    // user_profiles es la única fuente de verdad del rol (lo cambia un admin).
    // user_metadata lo puede editar el propio usuario, así que no se usa.
    const resolveRole = async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        const dbRole = data?.role
        if (dbRole === 'teacher' || dbRole === 'admin') setUserRole(dbRole)
        else setUserRole('student')
      } catch {
        setUserRole('student')
      } finally {
        setIsLoading(false)
      }
    }
    void resolveRole()
  }, [user?.id])

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

    // El rol se resuelve desde user_profiles al cambiar el usuario (ver resolveRole).
  }, [supabase])

  const sendMagicLink = useCallback(async (email: string) => {
    if (!email.trim()) throw new Error('Ingresa tu correo electrónico')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }, [supabase])

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Pedir refresh_token para sesiones de larga duración
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw new Error(error.message)
    // El navegador redirige a Google — no hay retorno síncrono
  }, [supabase])

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'student',
  ) => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      throw new Error('Todos los campos son obligatorios')
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Ya existe una cuenta con ese correo')
      }
      throw new Error(error.message)
    }
  }, [supabase])

  const logout = useCallback(async () => {
    manualLogout.current = true
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
      loginWithGoogle,
      sendMagicLink,
      register,
      logout,
    }),
    [user, session, userRole, isLoading, getAccessToken, login, loginWithGoogle, sendMagicLink, register, logout],
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
