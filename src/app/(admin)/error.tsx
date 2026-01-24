'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw, Shield } from 'lucide-react'

/**
 * Error page for Admin routes
 * Handles errors that occur in the admin area (moderation, etc.)
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin area error:', error)
    }

    // TODO: Log to external error tracking service
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-rose-gold/10 via-birthday-blush/5 to-birthday-purple/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-birthday-rose-gold/30 relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-birthday-blush/5 via-transparent to-birthday-purple/5 pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-birthday-blush via-birthday-purple to-birthday-gold rounded-full flex items-center justify-center opacity-10 absolute inset-0 animate-pulse"></div>
                <AlertTriangle
                  className="w-24 h-24 text-birthday-purple relative z-10"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-birthday-rose-gold via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
              Ops! Qualcosa è andato storto 😔
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-2 text-base">
              Si è verificato un problema nell'area amministratore.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Non preoccuparti, tutti i dati sono al sicuro. Riprova tra un momento.
            </p>

            {/* Error details (dev mode) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left border border-red-200">
                <p className="text-xs font-semibold text-red-700 mb-2">
                  Dettagli errore (dev):
                </p>
                <p className="text-xs font-mono text-red-600 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-gray-500 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {/* Retry */}
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-rose-gold via-birthday-purple to-birthday-gold text-white rounded-lg font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                <RefreshCw className="w-5 h-5" />
                Riprova
              </button>

              {/* Go to moderation */}
              <a
                href="/approve-content"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-birthday-blush/20 text-birthday-purple border-2 border-birthday-purple/30 rounded-lg font-medium hover:bg-birthday-blush/30 hover:border-birthday-purple/50 transition-all"
              >
                <Shield className="w-5 h-5" />
                Dashboard Admin
              </a>

              {/* Home */}
              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-gray-600 hover:text-birthday-purple transition-colors"
              >
                <Home className="w-4 h-4" />
                Torna alla Home
              </a>
            </div>
          </div>
        </div>

        {/* Footer message */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✨ Torneremo presto operativi ✨</p>
        </div>
      </div>
    </div>
  )
}
