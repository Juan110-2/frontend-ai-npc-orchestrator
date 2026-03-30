'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main
        className={cn(
          'min-h-screen flex-1 bg-background pt-14 transition-all duration-200 md:pt-0',
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        {children}
      </main>
    </div>
  )
}
