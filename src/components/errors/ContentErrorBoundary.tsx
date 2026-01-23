'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { ImageOff, RefreshCw } from 'lucide-react'

interface ContentErrorBoundaryProps {
  children: React.ReactNode
}

export function ContentErrorBoundary({ children }: ContentErrorBoundaryProps) {
  const handleReset = () => {
    // Refresh the page to reload content
    window.location.reload()
  }

  const fallback = (
    <div className="w-full py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center border-2 border-birthday-pink/20">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-birthday-pink via-birthday-purple to-birthday-gold rounded-full flex items-center justify-center opacity-10 absolute inset-0"></div>
            <ImageOff className="w-16 h-16 text-birthday-purple relative z-10" strokeWidth={1.5} />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent">
          Errore nel caricamento dei contenuti
        </h2>
        <p className="text-muted-foreground mb-6">
          Non siamo riusciti a caricare i contenuti della gallery. Riprova tra qualche istante.
        </p>

        {/* Retry button */}
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-pink to-birthday-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-5 h-5" />
          Ricarica contenuti
        </button>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={fallback} onReset={handleReset}>
      {children}
    </ErrorBoundary>
  )
}
