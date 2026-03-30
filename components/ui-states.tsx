'use client';

import { AlertCircle, FolderOpen, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// ===========================
// LOADING STATE
// ===========================

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Cargando...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ===========================
// ERROR STATE
// ===========================

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Error al cargar',
  message = 'Ha ocurrido un error al cargar los datos. Por favor, intenta de nuevo.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

// ===========================
// EMPTY STATE
// ===========================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon || <FolderOpen className="h-6 w-6 text-muted-foreground" />}
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ===========================
// SKELETON CARD
// ===========================

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      <div className="animate-pulse">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
        <div className="mt-6 space-y-3">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ===========================
// SKELETON LIST
// ===========================

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
