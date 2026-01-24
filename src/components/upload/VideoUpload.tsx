'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { saveVideoContentRecord } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import { checkUploadRateLimit } from '@/lib/utils'
import { isMobileDevice, isCameraAvailable } from '@/lib/mobile-utils'
import { Camera, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { analyzeNetworkError, uploadWithRetry } from '@/lib/network-errors'

interface VideoUploadProps {
  userId: string
}

export function VideoUpload({ userId }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [cameraAvailable, setCameraAvailable] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const maxSize = 10 * 1024 * 1024 // 10MB

  useEffect(() => {
    setIsMobile(isMobileDevice())
    setCameraAvailable(isCameraAvailable())
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > maxSize) {
      toast.error('Video troppo grande! 📏', {
        description: 'Il file supera i 10MB. Prova a comprimere il video o scegline uno più piccolo. Aiuteremo Giuliana a vedere il tuo video più velocemente! 🎬'
      })
      return
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Formato non supportato 🎥', {
        description: 'Usa MP4 o MOV per il tuo video. Stiamo preparando tutto per Giuliana! ✨'
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Video grande rilevato! ⏳', {
        description: 'Il caricamento potrebbe richiedere qualche momento in più. Vale la pena aspettare per un video così speciale! 🎬💝'
      })
    }

    setFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.quicktime']
    },
    maxFiles: 1,
    maxSize,
    disabled: isMobile, // Disable drag-and-drop on mobile
  })

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > maxSize) {
      toast.error('Video troppo grande! 📏', {
        description: 'Il file supera i 10MB. Prova a comprimere il video o scegline uno più piccolo. Aiuteremo Giuliana a vedere il tuo video più velocemente! 🎬'
      })
      return
    }

    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Formato non supportato 🎥', {
        description: 'Usa MP4 o MOV per il tuo video. Stiamo preparando tutto per Giuliana! ✨'
      })
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.warning('Video grande rilevato! ⏳', {
        description: 'Il caricamento potrebbe richiedere qualche momento in più. Vale la pena aspettare per un video così speciale! 🎬💝'
      })
    }

    setFile(selectedFile)
    const url = URL.createObjectURL(selectedFile)
    setPreview(url)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Seleziona un video 🎥', {
        description: 'Scegli un video speciale per Giuliana! Sarà bellissimo vederlo! ✨'
      })
      return
    }

    // Check client-side rate limit
    const rateLimitCheck = checkUploadRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      toast.error(`Aspetta ancora un attimo! ⏱️`, {
        description: `Attendi ${rateLimitCheck.remainingSeconds} secondi prima di caricare un altro contenuto. Stiamo preparando tutto per Giuliana! 🎁`
      })
      return
    }

    setLoading(true)
    setProgress(5)

    let fileName = ''

    try {
      // Upload directly to Supabase Storage (client-side)
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      setProgress(10)
      console.log('[Video Upload] Starting direct upload to Supabase Storage...')

      // Upload file directly to Supabase Storage with retry logic
      const uploadResult = await uploadWithRetry(
        () => supabase.storage
          .from('content-media')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          }),
        {
          maxRetries: 2,
          onRetry: (attempt, error) => {
            console.log(`[Video Upload] Retry attempt ${attempt}/3...`)
            toast.info('Riprovo il caricamento... 🔄', {
              description: `Tentativo ${attempt} di 3`
            })
          }
        }
      )

      if (uploadResult.error) {
        console.error('[Video Upload] Storage upload error:', uploadResult.error)
        const errorInfo = analyzeNetworkError(uploadResult.error)
        toast.error('Errore durante il caricamento del file 📤', {
          description: errorInfo.userMessage
        })
        setProgress(0)
        setLoading(false)
        return
      }

      setProgress(70)
      console.log('[Video Upload] File uploaded successfully to Storage')

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName)

      console.log('[Video Upload] Public URL:', publicUrl)
      setProgress(80)

      // Save content record to database via server action
      let result
      try {
        result = await saveVideoContentRecord(publicUrl)
      } catch (error) {
        console.error('[Video Upload] Server action error:', error)
        const errorInfo = analyzeNetworkError(error)
        toast.error('Errore durante il salvataggio 💾', {
          description: errorInfo.userMessage
        })
        // Clean up uploaded file
        await supabase.storage.from('content-media').remove([fileName])
        setProgress(0)
        setLoading(false)
        return
      }

      setProgress(95)

      if (result.success) {
        const count = result.contentCount || 0
        const countMessage = count === 1
          ? 'Questo è il tuo primo video! 🎊'
          : `Hai già caricato ${count} contenuti! Continua così! 🌟`

        // Celebration confetti!
        const colors = ['#FF69B4', '#9D4EDD', '#FFD700']
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.5, y: 0.5 },
          colors,
        })

        toast.success('🎉 Video caricato con successo!', {
          description: `In attesa di approvazione dall'admin. Giuliana lo vedrà presto! ${countMessage}`,
          duration: 6000
        })
        handleRemove()
        setProgress(100)
      } else {
        // If DB save fails, clean up the uploaded file
        await supabase.storage.from('content-media').remove([fileName])

        toast.error('Ops! Qualcosa è andato storto 😔', {
          description: result.error || 'Riprova tra un momento, stiamo sistemando tutto per te!',
        })
        setProgress(0)
      }
    } catch (error) {
      // Clean up on unexpected error
      if (fileName) {
        try {
          const supabase = createClient()
          await supabase.storage.from('content-media').remove([fileName])
        } catch (cleanupError) {
          console.error('[Video Upload] Cleanup error:', cleanupError)
        }
      }

      console.error('[Video Upload] Unexpected error:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Si è verificato un errore 😔', {
        description: errorInfo.userMessage
      })
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      style={{ scrollMarginBottom: '120px' }} // Prevent keyboard from blocking submit button on mobile
    >
      {/* File Input */}
      {!preview ? (
        <>
          {/* Desktop Drop Zone */}
          {!isMobile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-birthday-purple bg-birthday-purple/10'
                  : 'border-gray-300 hover:border-birthday-pink hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              <div className="space-y-3">
                <div className="text-6xl">🎥</div>
                {isDragActive ? (
                  <p className="text-lg font-medium text-birthday-purple">
                    Rilascia qui il video!
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-medium">
                      Trascina qui un video oppure clicca per selezionare
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formati supportati: MP4, MOV (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile Camera Access */}
          {isMobile && cameraAvailable && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={cameraInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
                id="camera-video-input"
              />
              <label
                htmlFor="camera-video-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Camera className="w-8 h-8 text-birthday-purple" />
                <span className="text-sm font-medium">Registra un video</span>
                <span className="text-xs text-muted-foreground">Usa la videocamera del dispositivo</span>
              </label>
            </div>
          )}

          {/* Mobile File Picker */}
          {isMobile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleFileInputChange}
                className="hidden"
                id="video-input-mobile"
              />
              <label
                htmlFor="video-input-mobile"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Video className="w-8 h-8 text-birthday-pink" />
                <span className="text-sm font-medium">Scegli dalla galleria</span>
                <span className="text-xs text-muted-foreground">Seleziona un video esistente</span>
              </label>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-black">
            <video
              src={preview}
              controls
              className="w-full h-auto max-h-[400px]"
              playsInline
            >
              Il tuo browser non supporta la riproduzione video.
            </video>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label="Rimuovi video"
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

      {/* Progress Bar - Enhanced for Mobile */}
      {loading && (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height: isMobile ? '8px' : '6px' }}>
            <div
              className="bg-gradient-to-r from-birthday-pink to-birthday-purple h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-center text-foreground`}>
              {progress < 30 ? '✨ Preparazione...' : progress < 70 ? '📤 Caricamento...' : '🎬 Finalizzazione...'}
            </p>
            <p className={`${isMobile ? 'text-base font-semibold' : 'text-sm'} text-birthday-purple`}>
              {progress}%
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="w-full h-14 rounded-md bg-gradient-to-r from-birthday-pink to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 touch-manipulation"
      >
        {loading && <Spinner size="sm" className="text-white" />}
        {loading ? '✨ Caricamento in corso...' : '🎬 Carica Video'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        📋 Il tuo contenuto sarà in attesa di approvazione dall'admin prima di essere visibile 💝✨
      </p>
    </form>
  )
}
