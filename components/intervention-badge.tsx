'use client';

import { cn } from '@/lib/utils';
import type { InterventionCategory } from '@/lib/types';
import { INTERVENTION_LABELS } from '@/lib/types';

interface InterventionBadgeProps {
  category: InterventionCategory;
  size?: 'sm' | 'md';
  className?: string;
}

const interventionColors: Record<InterventionCategory, string> = {
  supportive: 'bg-intervention-supportive/15 text-intervention-supportive border-intervention-supportive/30',
  neutral: 'bg-intervention-neutral/15 text-intervention-neutral border-intervention-neutral/30',
  confusing: 'bg-intervention-confusing/15 text-intervention-confusing border-intervention-confusing/30',
  indifferent: 'bg-intervention-indifferent/15 text-intervention-indifferent border-intervention-indifferent/30',
  invalidating: 'bg-intervention-invalidating/15 text-intervention-invalidating border-intervention-invalidating/30',
  inappropriate: 'bg-intervention-inappropriate/15 text-intervention-inappropriate border-intervention-inappropriate/30',
  risk: 'bg-intervention-risk/15 text-intervention-risk border-intervention-risk/30',
};

const sizes = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export function InterventionBadge({
  category,
  size = 'md',
  className,
}: InterventionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        interventionColors[category],
        sizes[size],
        className
      )}
    >
      {INTERVENTION_LABELS[category]}
    </span>
  );
}
