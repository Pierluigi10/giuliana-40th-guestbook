'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { uploadTextContent } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import { checkUploadRateLimit } from '@/lib/utils'

interface TextUploadProps {
  userId: string
}

export function TextUpload({ userId }: TextUploadProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const minLength = 10
  const maxLength = 1000
  const isValid = text.length >= minLength && text.length <= maxLength

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      toast.error('Il messaggio deve essere tra 10 e 1000 caratteri')
      return
    }

    // Check client-side rate limit
    const rateLimitCheck = checkUploadRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      toast.error(`Attendi ${rateLimitCheck.remainingSeconds} secondi prima di caricare un altro contenuto`)
      return
    }

    setLoading(true)

    try {
      const result = await uploadTextContent(text)

      if (result.success) {
        toast.success('Messaggio inviato! In attesa di approvazione 🎉')
        setText('')
      } else {
        toast.error(result.error || 'Errore durante l\'invio')
      }
    } catch (error) {
      toast.error('Si è verificato un errore')
      console.error(error)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text" className="block text-sm font-medium mb-2">
          Il tuo messaggio per Giuliana ✨
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio speciale per il compleanno di Giuliana..."
          className="w-full min-h-[200px] rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple resize-none"
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center mt-2">
          <p className={`text-sm ${charCountColor}`}>
            {charCount} / {maxLength} caratteri
            {charCount < minLength && ` (minimo ${minLength})`}
          </p>
          {charCount >= minLength && (
            <p className="text-sm text-green-500">✓ Pronto per l'invio</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full rounded-md bg-gradient-to-r from-birthday-pink to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading && <Spinner size="sm" className="text-white" />}
        {loading ? 'Invio in corso...' : '📨 Invia Messaggio'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Facciamo un rapido check e il tuo messaggio è in galleria 😊
      </p>
    </form>
  )
}
