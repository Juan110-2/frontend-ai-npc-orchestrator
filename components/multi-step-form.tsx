'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  children: ReactNode;
  className?: string;
}

export function MultiStepForm({ steps, currentStep, children, className }: MultiStepFormProps) {
  return (
    <div className={cn('flex gap-8', className)}>
      {/* Steps indicator */}
      <div className="hidden w-64 shrink-0 lg:block">
        <nav aria-label="Progress">
          <ol className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <li key={step.id} className="relative">
                  {index !== steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-4 top-8 -ml-px h-full w-0.5',
                        isComplete ? 'bg-primary' : 'bg-border'
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <div className="group relative flex items-start">
                    <span className="flex h-8 items-center" aria-hidden="true">
                      <span
                        className={cn(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                          isComplete && 'border-primary bg-primary text-primary-foreground',
                          isCurrent && 'border-primary bg-background',
                          !isComplete && !isCurrent && 'border-border bg-background'
                        )}
                      >
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full',
                              isCurrent ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        )}
                      </span>
                    </span>
                    <span className="ml-3 flex min-w-0 flex-col">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                      {step.description && (
                        <span className="text-xs text-muted-foreground">
                          {step.description}
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile steps indicator */}
      <div className="mb-4 lg:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <span className="text-muted-foreground">{steps[currentStep].title}</span>
        </div>
        <div className="mt-2 flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface StepContentProps {
  children: ReactNode;
  className?: string;
}

export function StepContent({ children, className }: StepContentProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}

interface StepActionsProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isLastStep?: boolean;
  isFirstStep?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  backLabel?: string;
  className?: string;
}

export function StepActions({
  onBack,
  onNext,
  onSubmit,
  isLastStep,
  isFirstStep,
  isSubmitting,
  nextLabel = 'Continuar',
  submitLabel = 'Guardar',
  backLabel = 'Atras',
  className,
}: StepActionsProps) {
  return (
    <div className={cn('flex items-center justify-between pt-6', className)}>
      <div>
        {!isFirstStep && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {backLabel}
          </button>
        )}
      </div>
      <div>
        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
