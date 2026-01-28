'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'

export function ResetPasswordForm() {
  const router = useRouter()
  const t = useTranslations('auth.resetPassword')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({
    password: '',
    confirmPassword: ''
  })

  // Validate password on change
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value && value.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: t('minLength') }))
    } else {
      setFieldErrors(prev => ({ ...prev, password: '' }))
    }
    // Also check confirm password match if it exists
    if (confirmPassword && value !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: t('passwordMismatch') }))
    } else if (confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
  }

  // Validate confirm password on change
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (value && value !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: t('passwordMismatch') }))
    } else {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Final validation check (should already be validated by real-time validation)
    if (!isFormValid()) {
      setError(t('errorAllFields'))
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError(t('genericError'))
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
          <h3 className="text-lg font-semibold">{t('successTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('successMessage')}
          </p>
        </div>
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
          {t('description')}
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          {t('newPasswordLabel')}
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
            placeholder={t('newPasswordPlaceholder')}
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
          <p className="mt-1 text-xs text-muted-foreground">{t('newPasswordHint')}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
          {t('confirmPasswordLabel')}
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
            placeholder={t('confirmPasswordPlaceholder')}
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
        className="w-full rounded-md bg-birthday-purple px-4 py-2 text-sm font-medium text-white hover:bg-birthday-purple/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? t('submittingButton') : t('submitButton')}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="text-birthday-purple hover:underline">
          {t('backToLogin')}
        </a>
      </p>
    </form>
  )
}
