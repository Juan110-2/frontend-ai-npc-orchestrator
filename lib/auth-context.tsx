"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  role: "student" | "instructor" | "admin"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ["/login", "/recuperar-password"]

// Mock user for demo
const MOCK_USER: User = {
  id: "user-1",
  email: "estudiante@universidad.edu",
  name: "Ana Martinez",
  role: "student"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for existing session
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("psicosim_user") : null
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("psicosim_user")
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/login")
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Demo: accept any email/password
    if (email && password) {
      const loggedUser = { ...MOCK_USER, email, name: email.split("@")[0] }
      setUser(loggedUser)
      localStorage.setItem("psicosim_user", JSON.stringify(loggedUser))
      setIsLoading(false)
      return true
    }
    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("psicosim_user")
    router.push("/login")
  }

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    return !!email
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
