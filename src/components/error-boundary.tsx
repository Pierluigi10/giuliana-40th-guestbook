'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw, Sparkles } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  showHomeButton?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Global Error Boundary Component
 * Catches React errors and displays a user-friendly fallback UI
 * with festive styling matching the app's theme
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error info
    this.setState({ errorInfo })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
    }

    // TODO: Send to external error tracking service (e.g., Sentry)
    // Example:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })

    if (this.props.onReset) {
      this.props.onReset()
    } else {
      // Default reset behavior: reload the page
      window.location.reload()
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default user-friendly fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-birthday-rose-gold/10 via-birthday-blush/5 to-birthday-purple/5 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Main error card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-birthday-rose-gold/30 relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-birthday-blush/5 via-transparent to-birthday-purple/5 pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon with animated gradient background */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-birthday-blush via-birthday-purple to-birthday-gold rounded-full flex items-center justify-center opacity-10 absolute inset-0 animate-pulse"></div>
                    <AlertTriangle
                      className="w-24 h-24 text-birthday-purple relative z-10"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                {/* Error title with festive emoji */}
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-birthday-rose-gold via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
                  Ops! Qualcosa è andato storto 😔
                </h1>

                {/* User-friendly message */}
                <p className="text-gray-600 mb-2 text-base">
                  Non ti preoccupare, riprova tra un momento!
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  I tuoi dati sono al sicuro e il problema verrà risolto presto.
                </p>

                {/* Error details (dev mode only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 rounded-lg text-left border border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-2">
                      Dettagli errore (solo in sviluppo):
                    </p>
                    <p className="text-xs font-mono text-red-600 break-all mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="text-xs font-mono text-gray-600">
                        <summary className="cursor-pointer text-red-600 hover:text-red-700">
                          Stack trace
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded text-[10px] overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  {/* Retry button */}
                  <button
                    onClick={this.handleReset}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-rose-gold via-birthday-purple to-birthday-gold text-white rounded-lg font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Riprova
                  </button>

                  {/* Home button (optional) */}
                  {this.props.showHomeButton !== false && (
                    <button
                      onClick={this.handleGoHome}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-birthday-champagne text-birthday-purple border-2 border-birthday-purple/30 rounded-lg font-medium hover:bg-birthday-blush/20 hover:border-birthday-purple/50 transition-all"
                    >
                      <Home className="w-5 h-5" />
                      Torna alla Home
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Decorative footer message */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-birthday-rose-gold/20">
                <Sparkles className="w-4 h-4 text-birthday-gold" />
                <span>Torneremo presto operativi</span>
                <Sparkles className="w-4 h-4 text-birthday-gold" />
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
