'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <html lang="it">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-birthday-pink/5 via-birthday-purple/5 to-birthday-gold/5 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-birthday-gold/20">
              {/* 404 illustration */}
              <div className="mb-6">
                <div className="text-8xl font-bold bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
                  404
                </div>
                <div className="mt-2 flex justify-center gap-2">
                  <span className="text-4xl">🎈</span>
                  <span className="text-4xl">🎉</span>
                  <span className="text-4xl">🎊</span>
                </div>
              </div>

              {/* Message */}
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent">
                Pagina non trovata
              </h1>
              <p className="text-gray-600 mb-6">
                Ops! Sembra che questa pagina si sia persa tra i confetti. Non preoccuparti, possiamo aiutarti a trovare la strada!
              </p>

              {/* Action buttons */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-pink to-birthday-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <Home className="w-5 h-5" />
                  Vai alla Home
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-birthday-gold/10 text-birthday-gold border-2 border-birthday-gold rounded-lg font-medium hover:bg-birthday-gold/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Torna indietro
                </button>
              </div>

              {/* Quick links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">Link utili:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link
                    href="/login"
                    className="text-sm px-3 py-1 rounded-full bg-birthday-pink/10 text-birthday-pink hover:bg-birthday-pink/20 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm px-3 py-1 rounded-full bg-birthday-purple/10 text-birthday-purple hover:bg-birthday-purple/20 transition-colors"
                  >
                    Registrati
                  </Link>
                  <Link
                    href="/gallery"
                    className="text-sm px-3 py-1 rounded-full bg-birthday-gold/10 text-birthday-gold hover:bg-birthday-gold/20 transition-colors"
                  >
                    Gallery
                  </Link>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>✨ Continua la festa altrove ✨</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
