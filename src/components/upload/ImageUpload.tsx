'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { uploadImageContent } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import Image from 'next/image'
import { checkUploadRateLimit } from '@/lib/utils'
import { isMobileDevice, isCameraAvailable, getImageCompressionOptions } from '@/lib/mobile-utils'
import { ImageTextOverlay } from './ImageTextOverlay'
import { Camera, Image as ImageIcon, Type } from 'lucide-react'

interface ImageUploadProps {
  userId: string
}

export function ImageUpload({ userId }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showTextOverlay, setShowTextOverlay] = useState(false)
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
      toast.error('File troppo grande! 📏', {
        description: 'Il file supera i 10MB. Prova a comprimere l\'immagine o scegline una più piccola. Aiuteremo Giuliana a vedere la tua foto più velocemente! 🖼️'
      })
      return
    }

    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > 2) {
      toast.info('Ottimizzazione in corso! ⚡', {
        description: 'Immagine grande rilevata, la comprimiamo automaticamente per un caricamento più veloce! 🎨'
      })
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
    setShowTextOverlay(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > maxSize) {
      toast.error('File troppo grande! 📏', {
        description: 'Il file supera i 10MB. Prova a comprimere l\'immagine o scegline una più piccola. Aiuteremo Giuliana a vedere la tua foto più velocemente! 🖼️'
      })
      return
    }

    const sizeMB = selectedFile.size / 1024 / 1024
    if (sizeMB > 2) {
      toast.info('Ottimizzazione in corso! ⚡', {
        description: 'Immagine grande rilevata, la comprimiamo automaticamente per un caricamento più veloce! 🎨'
      })
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleTextOverlaySave = (imageWithText: string) => {
    // Convert data URL to File
    fetch(imageWithText)
      .then(res => res.blob())
      .then(blob => {
        const newFile = new File([blob], file?.name || 'image-with-text.jpg', {
          type: 'image/jpeg',
        })
        setFile(newFile)
        setPreview(imageWithText)
        setShowTextOverlay(false)
        toast.success('Testo aggiunto! ✨', {
          description: 'Ora puoi caricare la foto con il testo!'
        })
      })
      .catch(() => {
        toast.error('Errore nel salvataggio del testo')
      })
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
      toast.error(`Aspetta ancora un attimo! ⏱️`, {
        description: `Attendi ${rateLimitCheck.remainingSeconds} secondi prima di caricare un altro contenuto. Stiamo preparando tutto per Giuliana! 🎁`
      })
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      let fileToUpload = file

      // Image compression - always compress on mobile, or if file > 2MB on desktop
      const fileSizeMB = file.size / 1024 / 1024
      const shouldCompress = isMobile || fileSizeMB > 2

      if (shouldCompress) {
        toast.info('Ottimizzazione immagine in corso... 🎨', {
          description: isMobile 
            ? 'Ottimizziamo la foto per il mobile! 📱'
            : 'Stiamo preparando la tua foto per renderla perfetta per Giuliana!'
        })

        const options = getImageCompressionOptions(isMobile)

        try {
          const compressedFile = await imageCompression(file, options)
          fileToUpload = compressedFile

          const originalSize = fileSizeMB.toFixed(2)
          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2)

          toast.success(`Perfetto! Immagine ottimizzata ✨`, {
            description: `Ridotta da ${originalSize}MB a ${compressedSize}MB. Pronta per Giuliana! 📸`
          })
        } catch (compressionError) {
          console.error('Compression failed:', compressionError)
          toast.warning('Caricamento immagine originale', {
            description: 'La compressione non è riuscita, ma caricheremo comunque la tua foto! 🖼️'
          })
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
        const count = result.contentCount || 0
        const countMessage = count === 1 
          ? 'Questa è la tua prima foto! 🎊' 
          : `Hai già caricato ${count} contenuti! Continua così! 🌟`
        
        toast.success('🎉 La tua foto è stata caricata!', {
          description: `Giuliana la vedrà presto! ${countMessage}`,
          duration: 5000
        })
        handleRemove()
        setProgress(100)
      } else {
        toast.error('Ops! Qualcosa è andato storto 😔', {
          description: result.error || 'Riprova tra un momento, stiamo sistemando tutto per te!',
        })
        setProgress(0)
      }
    } catch (error) {
      toast.error('Si è verificato un errore', {
        description: 'Non ti preoccupare, riprova tra un attimo! La tua foto è importante per Giuliana 📸💝'
      })
      console.error(error)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Overlay Editor */}
      {showTextOverlay && preview ? (
        <ImageTextOverlay
          imageUrl={preview}
          onSave={handleTextOverlaySave}
          onCancel={() => setShowTextOverlay(false)}
        />
      ) : !preview ? (
        <>
          {/* Drop Zone */}
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
              <div className="text-6xl">📸</div>
              {isDragActive ? (
                <p className="text-lg font-medium text-birthday-purple">
                  Rilascia qui la foto!
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    {isMobile ? 'Scegli una foto' : 'Trascina qui una foto oppure clicca per selezionare'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formati supportati: JPG, PNG, GIF, WEBP (Max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Camera Access Button (Mobile) */}
          {isMobile && cameraAvailable && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
                id="camera-input"
              />
              <label
                htmlFor="camera-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Camera className="w-8 h-8 text-birthday-purple" />
                <span className="text-sm font-medium">Scatta una foto</span>
                <span className="text-xs text-muted-foreground">Usa la fotocamera del dispositivo</span>
              </label>
            </div>
          )}

          {/* Alternative: File Picker Button (Mobile) */}
          {isMobile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) handleFileSelect(selectedFile)
                }}
                className="hidden"
                id="file-input-mobile"
              />
              <label
                htmlFor="file-input-mobile"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <ImageIcon className="w-8 h-8 text-birthday-pink" />
                <span className="text-sm font-medium">Scegli dalla galleria</span>
                <span className="text-xs text-muted-foreground">Seleziona una foto esistente</span>
              </label>
            </div>
          )}
        </>
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
              aria-label="Rimuovi immagine"
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

          {/* Add Text Overlay Button */}
          <button
            type="button"
            onClick={() => setShowTextOverlay(true)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Type className="w-4 h-4" />
            Aggiungi testo alla foto
          </button>
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
              {progress < 30 ? '✨ Preparazione...' : progress < 70 ? '📤 Caricamento...' : '🎨 Finalizzazione...'}
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
        className="w-full rounded-md bg-gradient-to-r from-birthday-pink to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading && <Spinner size="sm" className="text-white" />}
        {loading ? '✨ Caricamento in corso...' : '📸 Carica Foto'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Facciamo un rapido check e la tua foto sarà presto in galleria! Giuliana la adorerà! 😊✨
      </p>
    </form>
  )
}
