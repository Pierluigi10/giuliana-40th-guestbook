'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error page caught:', error)
    }

    // TODO: Log to external error tracking service
  }, [error])

  return (
    <html lang="it">
      <body>
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
              <p className="text-gray-600 mb-6">
                Ci dispiace, si è verificato un errore imprevisto. Non preoccuparti, i tuoi dati sono al sicuro!
              </p>

              {/* Error details in dev mode */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
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
                <button
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-pink to-birthday-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-5 h-5" />
                  Riprova
                </button>

                <a
                  href="/"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-birthday-gold/10 text-birthday-gold border-2 border-birthday-gold rounded-lg font-medium hover:bg-birthday-gold/20 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Torna alla Home
                </a>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>✨ Torneremo presto operativi ✨</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
