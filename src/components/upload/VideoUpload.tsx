'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { uploadVideoContent } from '@/actions/content'

interface VideoUploadProps {
  userId: string
}

export function VideoUpload({ userId }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const maxSize = 10 * 1024 * 1024 // 10MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      toast.error('Video troppo grande! Massimo 10MB')
      return
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Formato non supportato. Usa MP4 o MOV')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Video grande, il caricamento potrebbe richiedere tempo')
    }

    setFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setProgress(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Seleziona un video')
      return
    }

    setLoading(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress(30)
      const result = await uploadVideoContent(formData)
      setProgress(90)

      if (result.success) {
        toast.success('Video caricato! In attesa di approvazione 🎥')
        handleRemove()
        setProgress(100)
      } else {
        toast.error(result.error || 'Errore durante il caricamento')
        setProgress(0)
      }
    } catch (error) {
      toast.error('Si è verificato un errore')
      console.error(error)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Input */}
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <input
            type="file"
            accept="video/mp4,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            id="video-input"
          />
          <label
            htmlFor="video-input"
            className="cursor-pointer block space-y-3"
          >
            <div className="text-6xl">🎥</div>
            <p className="text-lg font-medium">
              Clicca per selezionare un video
            </p>
            <p className="text-sm text-muted-foreground">
              Formati supportati: MP4, MOV (Max 10MB)
            </p>
            <button
              type="button"
              className="mt-4 inline-block rounded-md bg-birthday-purple px-6 py-2 text-white hover:bg-birthday-purple/90 transition-colors"
            >
              Seleziona Video
            </button>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-black">
            <video
              src={preview}
              controls
              className="w-full h-auto max-h-[400px]"
            >
              Il tuo browser non supporta la riproduzione video.
            </video>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="bg-gray-50 rounded p-3 text-sm">
            <p className="font-medium">{file?.name}</p>
            <p className="text-muted-foreground">
              {(file!.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {loading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-birthday-pink to-birthday-purple h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Caricamento... {progress}%
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="w-full rounded-md bg-gradient-to-r from-birthday-pink to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? '📤 Caricamento...' : '🎬 Carica Video'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Il tuo video sarà visibile a Giuliana dopo l'approvazione dell'admin
      </p>
    </form>
  )
}
