'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { XCircle, RefreshCw } from 'lucide-react'

interface UploadErrorBoundaryProps {
  children: React.ReactNode
}

export function UploadErrorBoundary({ children }: UploadErrorBoundaryProps) {
  const handleReset = () => {
    // Refresh the page to reset upload form
    window.location.reload()
  }

  const fallback = (
    <div className="w-full py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center border-2 border-birthday-pink/20">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-birthday-pink via-birthday-purple to-birthday-gold rounded-full flex items-center justify-center opacity-10 absolute inset-0"></div>
            <XCircle className="w-16 h-16 text-birthday-purple relative z-10" strokeWidth={1.5} />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent">
          Errore nel modulo di upload
        </h2>
        <p className="text-muted-foreground mb-6">
          Si è verificato un problema con il modulo di caricamento. I tuoi contenuti sono ancora salvati se hai già caricato qualcosa!
        </p>

        {/* Retry button */}
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-birthday-pink to-birthday-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-5 h-5" />
          Ricarica modulo
        </button>

        {/* Help text */}
        <p className="mt-6 text-sm text-muted-foreground">
          💡 Suggerimento: Assicurati che i file siano più piccoli di 10MB
        </p>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={fallback} onReset={handleReset} showContactAdmin>
      {children}
    </ErrorBoundary>
  )
}
