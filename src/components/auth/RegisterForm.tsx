'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate email on change
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !isValidEmail(value)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email non valida' }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }))
    }
  }

  // Validate password on change
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value && value.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Minimo 6 caratteri' }))
    } else {
      setFieldErrors(prev => ({ ...prev, password: '' }))
    }
    // Also check confirm password match if it exists
    if (confirmPassword && value !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Le password non coincidono' }))
    } else if (confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
  }

  // Validate confirm password on change
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (value && value !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Le password non coincidono' }))
    } else {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
  }

  // Validate full name on change
  const handleFullNameChange = (value: string) => {
    setFullName(value)
    if (value && value.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, fullName: 'Inserisci nome e cognome' }))
    } else {
      setFieldErrors(prev => ({ ...prev, fullName: '' }))
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 0 &&
      isValidEmail(email) &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword &&
      !fieldErrors.fullName
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Final validation check (should already be validated by real-time validation)
    if (!isFormValid()) {
      setError('Compila correttamente tutti i campi')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Email confirmation sempre abilitata (dev e production)
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        // Gestisci errori specifici
        if (signUpError.message.includes('already registered')) {
          setError('Questa email è già registrata. Prova ad accedere o recupera la password.')
        } else if (signUpError.message.includes('rate limit')) {
          setError('Troppe registrazioni. Riprova tra qualche minuto.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        // Redirect alla pagina con messaggio "Controlla la tua email"
        router.push(`/pending-approval?mode=email_confirmation&email=${encodeURIComponent(email)}`)
      }
    } catch (err) {
      setError('Si è verificato un errore durante la registrazione')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-2">
          Nome completo
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => handleFullNameChange(e.target.value)}
          required
          className={`w-full rounded-md border ${fieldErrors.fullName ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          placeholder="Mario Rossi"
        />
        {fieldErrors.fullName && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.fullName}</p>
        )}
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
          className={`w-full rounded-md border ${fieldErrors.email ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          placeholder="mario@example.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            minLength={6}
            className={`w-full rounded-md border ${fieldErrors.password ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Almeno 6 caratteri</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
          Conferma Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            required
            minLength={6}
            className={`w-full rounded-md border ${fieldErrors.confirmPassword ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !isFormValid()}
        className="w-full rounded-md bg-birthday-purple px-4 py-2 text-sm font-medium text-white hover:bg-birthday-purple/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Registrazione in corso...' : 'Registrati'}
      </button>
    </form>
  )
}
