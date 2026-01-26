'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { loginSchema } from '@/lib/validation/schemas'

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  })

  // Track which fields have been touched (blur event)
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false
  })

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate email on change
  const handleEmailChange = (value: string) => {
    setEmail(value)
    // Only show error if field has been touched
    if (touchedFields.email) {
      if (value && !isValidEmail(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Email non valida' }))
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }))
      }
    }
  }

  // Validate email on blur
  const handleEmailBlur = () => {
    setTouchedFields(prev => ({ ...prev, email: true }))
    if (email && !isValidEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email non valida' }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }))
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      email.trim().length > 0 &&
      isValidEmail(email) &&
      password.length > 0 &&
      !fieldErrors.email
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (loading) {
      return
    }

    setError(null)

    // Final Zod validation
    const validationResult = loginSchema.safeParse({ email, password })
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      setError(firstError.message)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Email o password non corretti')
        setLoading(false)
        return
      }

      if (data.user) {
        // Get user profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single() as { data: { role: string } | null }

        if (!profile) {
          setError('Profilo non trovato')
          setLoading(false)
          return
        }

        // Keep loading state true during redirect (button stays disabled)
        // Redirect based on role (no more approval check)
        // Use window.location.href to force a full page reload and ensure cookies are properly set
        const redirectPath = redirect ||
          (profile.role === 'admin' ? '/approve-content' : '/gallery')
        window.location.href = redirectPath
        // Don't set loading to false here - let the page reload handle it
      }
    } catch (err) {
      setError('Si è verificato un errore durante l\'accesso')
      console.error(err)
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
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={handleEmailBlur}
          required
          className={`w-full min-h-[44px] rounded-md border ${fieldErrors.email ? 'border-destructive' : 'border-input'} bg-background px-3 py-2.5 md:py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation`}
          placeholder="mario@example.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs text-birthday-purple hover:underline"
          >
            Password dimenticata?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-2.5 md:py-2 pr-10 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
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
      </div>

      <button
        type="submit"
        disabled={loading || !isFormValid()}
        className="w-full min-h-[44px] rounded-md bg-birthday-purple px-4 py-2.5 md:py-2 text-base md:text-sm font-medium text-white hover:bg-birthday-purple/90 active:bg-birthday-purple/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-opacity touch-manipulation flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </button>
    </form>
  )
}
