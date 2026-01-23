'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { uploadImageContent } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import Image from 'next/image'
import { checkUploadRateLimit } from '@/lib/utils'

interface ImageUploadProps {
  userId: string
}

export function ImageUpload({ userId }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const maxSize = 10 * 1024 * 1024 // 10MB

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > maxSize) {
      toast.error('File troppo grande! Massimo 10MB')
      return
    }

    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > 2) {
      toast.info('Immagine grande, verrà compressa automaticamente prima dell\'upload')
    }

    setFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize,
  })

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Seleziona un\'immagine')
      return
    }

    // Check client-side rate limit
    const rateLimitCheck = checkUploadRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      toast.error(`Attendi ${rateLimitCheck.remainingSeconds} secondi prima di caricare un altro contenuto`)
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      let fileToUpload = file

      // Image compression if file > 2MB
      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB > 2) {
        toast.info('Compressione immagine in corso...')

        const options = {
          maxSizeMB: 1,          // max 1MB after compression
          maxWidthOrHeight: 1920, // max 1920px (Full HD)
          useWebWorker: true,     // use Web Worker for performance
          fileType: 'image/jpeg', // convert to optimized JPEG
        }

        try {
          const compressedFile = await imageCompression(file, options)
          fileToUpload = compressedFile

          const originalSize = fileSizeMB.toFixed(2)
          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2)

          toast.success(`Immagine compressa: ${originalSize}MB → ${compressedSize}MB`)
        } catch (compressionError) {
          console.error('Compression failed:', compressionError)
          toast.warning('Compressione fallita, upload immagine originale')
          // Use original file as fallback
        }
      }

      setProgress(10)

      const formData = new FormData()
      formData.append('file', fileToUpload)

      setProgress(30)
      const result = await uploadImageContent(formData)
      setProgress(90)

      if (result.success) {
        toast.success('Foto caricata! In attesa di approvazione 📸')
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
      {/* Drop Zone */}
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-birthday-purple bg-birthday-purple/10'
              : 'border-gray-300 hover:border-birthday-pink hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <div className="text-6xl">📸</div>
            {isDragActive ? (
              <p className="text-lg font-medium text-birthday-purple">
                Rilascia qui la foto!
              </p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Trascina qui una foto oppure clicca per selezionare
                </p>
                <p className="text-sm text-muted-foreground">
                  Formati supportati: JPG, PNG, GIF, WEBP (Max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <Image
              src={preview}
              alt="Preview"
              width={800}
              height={600}
              className="w-full h-auto max-h-[400px] object-contain bg-gray-50"
            />
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
        className="w-full rounded-md bg-gradient-to-r from-birthday-pink to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading && <Spinner size="sm" className="text-white" />}
        {loading ? 'Caricamento...' : '📸 Carica Foto'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Facciamo un rapido check e la tua foto è in galleria 😊
      </p>
    </form>
  )
}
