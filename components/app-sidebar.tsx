'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  Map,
  ClipboardCheck,
  Play,
  LogOut,
  Menu,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Moldes', href: '/protopersonas', icon: Brain },
  { name: 'Perfiles', href: '/perfiles', icon: UserCircle },
  { name: 'Escenarios', href: '/escenarios', icon: Map },
  { name: 'Sesiones', href: '/sesiones', icon: Play },
  { name: 'Evaluacion', href: '/evaluacion', icon: ClipboardCheck },
];

type AppSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function AppSidebar({ isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const { userEmail, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const navItems = (compact = false) => (
    <nav className={cn('space-y-1 px-3 py-4', compact && 'px-2')}>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.name}
            href={item.href}
            title={compact ? item.name : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              compact && 'justify-center px-2',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
            {!compact && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-sidebar px-3 text-sidebar-foreground md:hidden">
        <Link href="/" className="text-base font-semibold tracking-tight">
          AI Orchestrator
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-r bg-sidebar text-sidebar-foreground">
            <SheetHeader>
              <SheetTitle className="text-sidebar-foreground">Menu</SheetTitle>
            </SheetHeader>
            {navItems()}
            <div className="border-t border-sidebar-border p-3">
              <p className="mb-3 truncate text-xs text-sidebar-foreground/60">{userEmail}</p>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesion
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', isCollapsed && 'justify-center px-2')}>
          {!isCollapsed && (
            <Link href="/" className="text-lg font-semibold tracking-tight">
              AI Orchestrator
            </Link>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('text-sidebar-foreground hover:bg-sidebar-accent', isCollapsed ? 'ml-0' : 'ml-auto')}
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">{navItems(isCollapsed)}</div>
        <div className={cn('border-t border-sidebar-border p-3', isCollapsed && 'px-2')}>
          {!isCollapsed && <p className="mb-3 truncate text-xs text-sidebar-foreground/60">{userEmail}</p>}
          <Button
            variant="ghost"
            className={cn(
              'w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              isCollapsed ? 'justify-center px-2' : 'justify-start'
            )}
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar sesion' : undefined}
          >
            <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && 'Cerrar sesion'}
          </Button>
        </div>
      </aside>
    </>
  );
}
