'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Map,
  MessageSquare,
  ClipboardCheck,
  Settings,
  Play,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Protopersonas', href: '/protopersonas', icon: Brain },
  { name: 'Perfiles', href: '/perfiles', icon: UserCircle },
  { name: 'Escenarios', href: '/escenarios', icon: Map },
  { name: 'Sesiones', href: '/sesiones', icon: Play },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Evaluacion', href: '/evaluacion', icon: ClipboardCheck },
  { name: 'Configuracion', href: '/configuracion', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Brain className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PsicoSim</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Brain className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Colapsar</span>}
        </Button>
      </div>
    </aside>
  );
}
