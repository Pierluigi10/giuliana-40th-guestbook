'use client'

import { useState } from 'react'
import { AlertCircle, Bug } from 'lucide-react'

/**
 * Test page for Error Boundary (Development Only)
 * This page helps test the error boundary functionality
 * REMOVE OR PROTECT THIS PAGE IN PRODUCTION!
 */

export default function TestErrorBoundaryPage() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    // This will trigger the Error Boundary
    throw new Error('Test Error: This is a simulated error to test the Error Boundary!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-rose-gold/10 via-birthday-blush/5 to-birthday-purple/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-birthday-rose-gold/30">
          {/* Warning header */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-yellow-900">Pagina di Test - Solo Sviluppo</h2>
              <p className="text-sm text-yellow-700">
                Questa pagina serve solo per testare l'Error Boundary. Rimuovila in produzione!
              </p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-birthday-rose-gold via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
            Test Error Boundary
          </h1>

          <p className="text-gray-600 mb-6">
            Clicca sul pulsante qui sotto per simulare un errore React e vedere come l'Error Boundary
            gestisce la situazione mostrando una UI user-friendly.
          </p>

          {/* Test scenarios */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Cosa succede quando clicchi "Simula Errore":
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Viene lanciato un errore React intenzionale</li>
                <li>L'Error Boundary cattura l'errore</li>
                <li>Viene mostrata una pagina di errore user-friendly</li>
                <li>L'utente può riprovare o tornare alla home</li>
                <li>In modalità sviluppo, vengono mostrati i dettagli dell'errore</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Luoghi dove è attivo l'Error Boundary:</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li><code className="bg-blue-100 px-1 rounded">src/app/layout.tsx</code> - GlobalErrorBoundary globale</li>
                <li><code className="bg-blue-100 px-1 rounded">src/app/error.tsx</code> - Error page root</li>
                <li><code className="bg-blue-100 px-1 rounded">src/app/(guest)/error.tsx</code> - Error page area guest</li>
                <li><code className="bg-blue-100 px-1 rounded">src/app/(admin)/error.tsx</code> - Error page area admin</li>
              </ul>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => setShouldThrow(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <Bug className="w-5 h-5" />
            Simula Errore (Test Error Boundary)
          </button>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <a
              href="/"
              className="text-birthday-purple hover:text-birthday-gold transition-colors text-sm font-medium"
            >
              ← Torna alla Home
            </a>
          </div>
        </div>

        {/* Note */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>💡 Ricorda di rimuovere questa pagina prima del deploy in produzione!</p>
        </div>
      </div>
    </div>
  )
}
