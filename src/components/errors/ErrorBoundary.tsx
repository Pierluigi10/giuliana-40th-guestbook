'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  showContactAdmin?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // TODO: Send to external error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
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

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-birthday-pink/5 via-birthday-purple/5 to-birthday-gold/5 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-birthday-pink/20">
              {/* Sad confetti icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-birthday-pink via-birthday-purple to-birthday-gold rounded-full flex items-center justify-center opacity-10 absolute inset-0"></div>
                  <AlertTriangle className="w-24 h-24 text-birthday-purple relative z-10" strokeWidth={1.5} />
                </div>
              </div>

              {/* Error message */}
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
                Ops! Qualcosa è andato storto
              </h1>
              <p className="text-muted-foreground mb-6">
                Ci dispiace, si è verificato un errore imprevisto. Non preoccuparti, i tuoi dati sono al sicuro!
              </p>

              {/* Error details in dev mode */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-destructive/10 rounded-lg text-left">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-pink to-birthday-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-5 h-5" />
                  Riprova
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-birthday-gold/10 text-birthday-gold border-2 border-birthday-gold rounded-lg font-medium hover:bg-birthday-gold/20 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Torna alla Home
                </button>

                {this.props.showContactAdmin && (
                  <button
                    onClick={() => window.location.href = 'mailto:admin@example.com?subject=Errore App Guestbook'}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Contatta l'amministratore
                  </button>
                )}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>✨ Torneremo presto operativi ✨</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
