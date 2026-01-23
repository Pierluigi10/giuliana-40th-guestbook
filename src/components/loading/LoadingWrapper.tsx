'use client'

import { ReactNode } from 'react'
import { CenteredSpinner } from './Spinner'

interface LoadingWrapperProps {
  isLoading: boolean
  children: ReactNode
  fallback?: ReactNode
  message?: string
}

/**
 * A wrapper component that shows a loading state while data is being fetched
 * Usage:
 * <LoadingWrapper isLoading={isLoading}>
 *   <YourContent />
 * </LoadingWrapper>
 */
export function LoadingWrapper({ isLoading, children, fallback, message }: LoadingWrapperProps) {
  if (isLoading) {
    return fallback ? <>{fallback}</> : <CenteredSpinner message={message} />
  }

  return <>{children}</>
}
