'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate email on change
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !isValidEmail(value)) {
      setEmailError('Email non valida')
    } else {
      setEmailError('')
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return email.trim().length > 0 && isValidEmail(email) && !emailError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Use NEXT_PUBLIC_APP_URL if set (production), otherwise use current origin (development)
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectUrl}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Si è verificato un errore. Riprova più tardi.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Email inviata!</h3>
          <p className="text-sm text-muted-foreground">
            Controlla la tua casella di posta. Ti abbiamo inviato un link per reimpostare la password.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Non hai ricevuto l&apos;email? Controlla anche nello spam.
          </p>
        </div>
        <a
          href="/login"
          className="inline-block text-sm text-birthday-purple hover:underline"
        >
          Torna al login
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
          className={`w-full rounded-md border ${emailError ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          placeholder="mario@example.com"
        />
        {emailError && (
          <p className="mt-1 text-xs text-destructive">{emailError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !isFormValid()}
        className="w-full rounded-md bg-birthday-purple px-4 py-2 text-sm font-medium text-white hover:bg-birthday-purple/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? 'Invio in corso...' : 'Invia link di reset'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="text-birthday-purple hover:underline">
          Torna al login
        </a>
      </p>
    </form>
  )
}
