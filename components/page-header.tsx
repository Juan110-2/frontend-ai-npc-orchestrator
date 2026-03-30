'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.icon}
              {action.label}
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
