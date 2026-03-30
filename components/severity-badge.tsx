'use client';

import { cn } from '@/lib/utils';
import type { SeverityLevel } from '@/lib/types';
import { SEVERITY_LABELS } from '@/lib/types';

interface SeverityBadgeProps {
  level: SeverityLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const severityColors: Record<SeverityLevel, string> = {
  1: 'bg-severity-1/15 text-severity-1 border-severity-1/30',
  2: 'bg-severity-2/15 text-severity-2 border-severity-2/30',
  3: 'bg-severity-3/15 text-severity-3 border-severity-3/30',
  4: 'bg-severity-4/15 text-severity-4 border-severity-4/30',
  5: 'bg-severity-5/15 text-severity-5 border-severity-5/30',
};

const dotColors: Record<SeverityLevel, string> = {
  1: 'bg-severity-1',
  2: 'bg-severity-2',
  3: 'bg-severity-3',
  4: 'bg-severity-4',
  5: 'bg-severity-5',
};

const sizes = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1',
};

export function SeverityBadge({
  level,
  showLabel = true,
  size = 'md',
  className,
}: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        severityColors[level],
        sizes[size],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[level])} />
      {showLabel ? SEVERITY_LABELS[level] : level}
    </span>
  );
}

// ===========================
// SEVERITY INDICATOR (Bar)
// ===========================

interface SeverityIndicatorProps {
  level: SeverityLevel;
  className?: string;
}

export function SeverityIndicator({ level, className }: SeverityIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {([1, 2, 3, 4, 5] as SeverityLevel[]).map((l) => (
        <div
          key={l}
          className={cn(
            'h-2 w-4 rounded-sm transition-colors',
            l <= level ? dotColors[l] : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}
