'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { uploadTextContent } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import { checkUploadRateLimit } from '@/lib/utils'
import { analyzeNetworkError } from '@/lib/network-errors'
import { textContentSchema } from '@/lib/validation/schemas'

interface TextUploadProps {
  userId: string
}

// Shake animation variants
const shakeAnimation = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
}

export function TextUpload({ userId }: TextUploadProps) {
  const t = useTranslations('upload.text')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)

  const minLength = 10
  const maxLength = 1000
  const isValid = text.length >= minLength && text.length <= maxLength
  const showError = touched && !isValid && text.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Final Zod validation (in addition to real-time validation)
    const validationResult = textContentSchema.safeParse(text)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]

      // Trigger shake animation
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 400)

      // Haptic feedback on mobile (if supported)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200)
      }

      toast.error(firstError.message, {
        description: t('addMoreToast')
      })
      return
    }

    // Check client-side rate limit
    const rateLimitCheck = checkUploadRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      toast.error(t('rateLimitTitle'), {
        description: t('rateLimitDescription', { remainingSeconds: rateLimitCheck.remainingSeconds || 60 })
      })
      return
    }

    setLoading(true)

    try {
      const result = await uploadTextContent(text)

      if (result.success) {
        const count = result.contentCount || 0
        const countMessage = count === 1
          ? t('firstMessageToast')
          : t('multipleContentToast', { count })

        // Celebration confetti!
        const colors = ['#D4A5A5', '#FFB6C1', '#9D4EDD', '#FFD700']
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.5, y: 0.5 },
          colors,
        })

        toast.success(t('successToast'), {
          description: t('successDescription', { message: countMessage }),
          duration: 6000
        })
        setText('')
      } else {
        toast.error(t('errorToast'), {
          description: result.error || t('errorDescription'),
        })
      }
    } catch (error) {
      console.error('[Text Upload] Unexpected error:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error(t('unexpectedErrorToast'), {
        description: errorInfo.userMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const charCount = text.length
  const charCountColor =
    charCount < minLength ? 'text-red-500' :
    charCount > maxLength * 0.9 ? 'text-orange-500' :
    'text-green-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      style={{ scrollMarginBottom: '120px' }} // Prevent keyboard from blocking submit button on mobile
    >
      <motion.div
        animate={shouldShake ? "shake" : ""}
        variants={shakeAnimation}
      >
        <label htmlFor="text" className="block text-sm font-medium mb-2">
          {t('label')}
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={t('placeholder')}
          className={`w-full min-h-[200px] rounded-md border bg-background px-4 py-3 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple resize-none touch-manipulation transition-colors ${
            showError ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'
          }`}
          maxLength={maxLength}
          autoFocus
        />
        <div className="flex justify-between items-center mt-2">
          <p className={`text-sm ${charCountColor}`}>
            {charCount < minLength
              ? t('charCountMin', { count: charCount, max: maxLength, min: minLength })
              : t('charCount', { count: charCount, max: maxLength })}
          </p>
          {charCount >= minLength && (
            <p className="text-sm text-green-500">{t('readyToSend')}</p>
          )}
        </div>
        {showError && (
          <p className="text-sm text-red-500 mt-1">
            {t('minCharError', { min: minLength })}
          </p>
        )}
      </motion.div>

      <motion.button
        type="submit"
        disabled={!isValid || loading}
        whileHover={{ scale: isValid && !loading ? 1.02 : 1 }}
        whileTap={{ scale: isValid && !loading ? 0.98 : 1 }}
        className="w-full h-14 rounded-md bg-gradient-to-r from-birthday-rose-gold via-birthday-blush to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 touch-manipulation"
      >
        {loading && <Spinner size="sm" className="text-white" />}
        {loading ? t('submittingButton') : t('submitButton')}
      </motion.button>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>{t('pendingApprovalNote')}</p>
        <p>{t('infoMessage.contact', { email: 'pierluigibaiano@gmail.com' })}</p>
      </div>
    </form>
  )
}
