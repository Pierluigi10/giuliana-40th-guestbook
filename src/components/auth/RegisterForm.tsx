'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { registerSchema } from '@/lib/validation/schemas'

export function RegisterForm() {
  const router = useRouter()
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Honeypot field - invisible to users, only bots will fill it
  const [website, setWebsite] = useState('')

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })

  // Track which fields have been touched (blur event)
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    fullName: false
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
        setFieldErrors(prev => ({ ...prev, email: t('validation.email.invalid') }))
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }))
      }
    }
  }

  // Validate email on blur
  const handleEmailBlur = () => {
    setTouchedFields(prev => ({ ...prev, email: true }))
    if (email && !isValidEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: t('validation.email.invalid') }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }))
    }
  }

  // Validate password on change
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    // Only show error if field has been touched
    if (touchedFields.password) {
      if (value && value.length < 6) {
        setFieldErrors(prev => ({ ...prev, password: t('validation.password.tooShort') }))
      } else {
        setFieldErrors(prev => ({ ...prev, password: '' }))
      }
    }
    // Also check confirm password match if it exists and has been touched
    if (touchedFields.confirmPassword && confirmPassword) {
      if (value !== confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: t('validation.password.mismatch') }))
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
      }
    }
  }

  // Validate password on blur
  const handlePasswordBlur = () => {
    setTouchedFields(prev => ({ ...prev, password: true }))
    if (password && password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: t('validation.password.tooShort') }))
    } else {
      setFieldErrors(prev => ({ ...prev, password: '' }))
    }
  }

  // Validate confirm password on change
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    // Only show error if field has been touched
    if (touchedFields.confirmPassword) {
      if (value && value !== password) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: t('validation.password.mismatch') }))
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
      }
    }
  }

  // Validate confirm password on blur
  const handleConfirmPasswordBlur = () => {
    setTouchedFields(prev => ({ ...prev, confirmPassword: true }))
    if (confirmPassword && confirmPassword !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: t('validation.password.mismatch') }))
    } else {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
  }

  // Validate full name on change
  const handleFullNameChange = (value: string) => {
    setFullName(value)
    // Only show error if field has been touched
    if (touchedFields.fullName) {
      if (value && value.trim().length < 2) {
        setFieldErrors(prev => ({ ...prev, fullName: t('validation.fullName.tooShort') }))
      } else {
        setFieldErrors(prev => ({ ...prev, fullName: '' }))
      }
    }
  }

  // Validate full name on blur
  const handleFullNameBlur = () => {
    setTouchedFields(prev => ({ ...prev, fullName: true }))
    if (fullName && fullName.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, fullName: t('validation.fullName.tooShort') }))
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

    // Prevent double submission
    if (loading) {
      return
    }

    setError(null)

    // Final Zod validation (in addition to real-time validation)
    const validationResult = registerSchema.safeParse({
      email,
      password,
      fullName,
      website,
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      setError(firstError.message)
      return
    }

    // Additional check: confirm password match (not in registerSchema)
    if (password !== confirmPassword) {
      setError(t('validation.password.mismatch'))
      return
    }

    setLoading(true)

    try {
      // Register user via API (auto-confirms email)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          website, // Send honeypot to backend for additional validation
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || t('auth.register.errorGeneric'))
        setLoading(false)
        return
      }

      // Auto-login after successful registration
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(t('auth.register.errorAutoLogin'))
        setLoading(false)
        return
      }

      // Set flag to show tutorial on first gallery visit
      sessionStorage.setItem('show_gallery_tutorial', 'true')

      // Keep loading state true during redirect (button stays disabled)
      // Redirect to gallery after successful registration and auto-login
      router.push('/gallery')
      router.refresh()
      // Don't set loading to false here - let the page reload handle it
    } catch (err) {
      setError(t('auth.register.errorGeneric'))
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

      {/* Honeypot field - hidden from real users, only bots will fill it */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-2">
          {t('auth.fullName.label')}
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => handleFullNameChange(e.target.value)}
          onBlur={handleFullNameBlur}
          required
          className={`w-full min-h-[44px] rounded-md border ${fieldErrors.fullName ? 'border-destructive' : 'border-input'} bg-background px-3 py-2.5 md:py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation`}
          placeholder={t('auth.fullName.placeholder')}
        />
        {fieldErrors.fullName && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          {t('auth.email.label')}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={handleEmailBlur}
          required
          className={`w-full min-h-[44px] rounded-md border ${fieldErrors.email ? 'border-destructive' : 'border-input'} bg-background px-3 py-2.5 md:py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation`}
          placeholder={t('auth.email.placeholder')}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          {t('auth.password.label')}
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={handlePasswordBlur}
            required
            minLength={6}
            autoComplete="new-password"
            className={`w-full min-h-[44px] rounded-md border ${fieldErrors.password ? 'border-destructive' : 'border-input'} bg-background px-3 py-2.5 md:py-2 pr-10 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation`}
            placeholder={t('auth.password.placeholder')}
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
          <p className="mt-1 text-xs text-muted-foreground">{t('auth.password.hint')}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
          {t('auth.confirmPassword.label')}
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            onBlur={handleConfirmPasswordBlur}
            required
            minLength={6}
            autoComplete="new-password"
            className={`w-full min-h-[44px] rounded-md border ${fieldErrors.confirmPassword ? 'border-destructive' : 'border-input'} bg-background px-3 py-2.5 md:py-2 pr-10 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation`}
            placeholder={t('auth.password.placeholder')}
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
        className="w-full min-h-[44px] rounded-md bg-birthday-purple px-4 py-2.5 md:py-2 text-base md:text-sm font-medium text-white hover:bg-birthday-purple/90 active:bg-birthday-purple/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? t('auth.register.submitting') : t('auth.register.submit')}
      </button>
    </form>
  )
}
