'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const isAuthRoute = pathname.startsWith('/auth')

  // Redirige al login si el usuario llega a una ruta protegida sin sesión activa
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthRoute) {
      router.replace('/auth/login')
    }
  }, [isLoading, isAuthenticated, isAuthRoute, router])

  if (isAuthRoute) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      {/* Spacer que reserva el ancho del sidebar fijo en el flujo flex */}
      <div
        aria-hidden
        className={cn(
          'hidden shrink-0 transition-all duration-200 md:block',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      />
      <main
        className="min-h-screen flex-1 min-w-0 overflow-x-hidden bg-background pt-14 transition-all duration-200 md:pt-0"
      >
        {children}
      </main>
    </div>
  )
}
