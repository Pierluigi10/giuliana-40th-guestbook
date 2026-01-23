'use client'

import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={cn(
        'inline-block rounded-full border-solid border-current border-r-transparent animate-spin',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  transparent?: boolean
}

export function LoadingOverlay({ message, transparent = false }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 z-10',
        transparent ? 'bg-white/70' : 'bg-white'
      )}
    >
      <Spinner size="lg" className="text-birthday-purple" />
      {message && (
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

interface CenteredSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CenteredSpinner({ message, size = 'lg' }: CenteredSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size={size} className="text-birthday-purple" />
      {message && (
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
