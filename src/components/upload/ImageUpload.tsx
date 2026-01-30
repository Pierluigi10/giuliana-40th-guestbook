'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import { useTranslations } from 'next-intl'
import { saveImageContentRecord } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import Image from 'next/image'
import { checkUploadRateLimit } from '@/lib/utils'
import { isMobileDevice, isCameraAvailable, getImageCompressionOptions } from '@/lib/mobile-utils'
import { Camera, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { analyzeNetworkError, uploadWithRetry } from '@/lib/network-errors'

interface ImageUploadProps {
  userId: string
}

export function ImageUpload({ userId }: ImageUploadProps) {
  const t = useTranslations()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [cameraAvailable, setCameraAvailable] = useState(false)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileReaderRef = useRef<FileReader | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const maxSize = 10 * 1024 * 1024 // 10MB

  useEffect(() => {
    setIsMobile(isMobileDevice())
    setCameraAvailable(isCameraAvailable())
  }, [])

  useEffect(() => {
    abortControllerRef.current = new AbortController()
    return () => {
      abortControllerRef.current?.abort()
      if (fileReaderRef.current) {
        fileReaderRef.current.abort()
      }
    }
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > maxSize) {
      toast.error(t('upload.image.fileTooLargeTitle'), {
        description: t('upload.image.fileTooLargeDescription')
      })
      return
    }

    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > 2) {
      toast.info(t('upload.image.optimizingTitle'), {
        description: t('upload.image.optimizingDescription')
      })
    }

    setFile(file)

    // Abort previous reader if exists
    if (fileReaderRef.current) {
      fileReaderRef.current.abort()
    }

    const reader = new FileReader()
    fileReaderRef.current = reader
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [t])

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
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > maxSize) {
      toast.error(t('upload.image.fileTooLargeTitle'), {
        description: t('upload.image.fileTooLargeDescription')
      })
      return
    }

    const sizeMB = selectedFile.size / 1024 / 1024
    if (sizeMB > 2) {
      toast.info(t('upload.image.optimizingTitle'), {
        description: t('upload.image.optimizingDescription')
      })
    }

    setFile(selectedFile)

    // Abort previous reader if exists
    if (fileReaderRef.current) {
      fileReaderRef.current.abort()
    }

    const reader = new FileReader()
    fileReaderRef.current = reader
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error(t('upload.image.fileNotSelected'))
      return
    }

    // Check client-side rate limit
    const rateLimitCheck = checkUploadRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      toast.error(t('upload.image.rateLimitTitle'), {
        description: t('upload.image.rateLimitDescription', {
          remainingSeconds: String(rateLimitCheck.remainingSeconds)
        })
      })
      return
    }

    setLoading(true)
    setProgress(0)

    let fileName = '' // Declare outside try block for cleanup access

    try {
      let fileToUpload = file

      // Image compression - always compress on mobile, or if file > 2MB on desktop
      const fileSizeMB = file.size / 1024 / 1024
      const shouldCompress = isMobile || fileSizeMB > 2

      if (shouldCompress) {
        toast.info(t('upload.image.compressingImage'), {
          description: isMobile
            ? t('upload.image.compressingLargeImage')
            : t('upload.image.compressingDesktopImage')
        })

        const options = getImageCompressionOptions(isMobile)

        try {
          const compressedFile = await imageCompression(file, options)
          fileToUpload = compressedFile

          const originalSize = fileSizeMB.toFixed(2)
          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2)

          toast.success(t('upload.image.optimizedTitle'), {
            description: t('upload.image.optimizedDescription', {
              originalMB: originalSize,
              compressedMB: compressedSize
            })
          })
        } catch (compressionError) {
          console.error('Compression failed:', compressionError)
          toast.warning(t('upload.image.uploadingOriginalTitle'), {
            description: t('upload.image.uploadingOriginalDescription')
          })
          // Use original file as fallback
        }
      }

      setProgress(10)

      // Upload directly to Supabase Storage (client-side)
      const supabase = createClient()

      // Generate unique filename
      const fileExt = fileToUpload.name.split('.').pop()
      fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      setProgress(15)
      console.log('[Image Upload] Starting direct upload to Supabase Storage...')

      // Upload file directly to Supabase Storage with retry logic
      const uploadResult = await uploadWithRetry(
        () => supabase.storage
          .from('content-media')
          .upload(fileName, fileToUpload, {
            contentType: fileToUpload.type,
            upsert: false,
          }),
        {
          maxRetries: 2,
          onRetry: (attempt, error) => {
            console.log(`[Image Upload] Retry attempt ${attempt}/3...`)
            toast.info(t('upload.image.retryingUpload'), {
              description: t('upload.image.retryAttempt', { attempt })
            })
          }
        }
      )

      if (uploadResult.error) {
        console.error('[Image Upload] Storage upload error:', uploadResult.error)
        const errorInfo = analyzeNetworkError(uploadResult.error)
        toast.error(t('upload.image.uploadErrorTitle'), {
          description: errorInfo.userMessage
        })
        setProgress(0)
        setLoading(false)
        return
      }

      setProgress(70)
      console.log('[Image Upload] File uploaded successfully to Storage')

      // Check if operation was aborted before proceeding
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[Image Upload] Operation aborted, cleaning up...')
        await supabase.storage.from('content-media').remove([fileName])
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName)

      console.log('[Image Upload] Public URL:', publicUrl)
      setProgress(80)

      // Save content record to database via server action
      let result
      try {
        result = await saveImageContentRecord(publicUrl)
      } catch (error) {
        console.error('[Image Upload] Server action error:', error)
        const errorInfo = analyzeNetworkError(error)
        toast.error(t('upload.image.uploadErrorTitle'), {
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
          ? t('upload.image.firstPhotoToast')
          : t('upload.image.multipleContentToast', { count })

        // Celebration confetti!
        const colors = ['#D4A5A5', '#FFB6C1', '#9D4EDD', '#FFD700']
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.5, y: 0.5 },
          colors,
        })

        toast.success(t('upload.image.successToast'), {
          description: `${t('upload.image.successDescription')} ${countMessage}`,
          duration: 6000
        })
        handleRemove()
        setProgress(100)
      } else {
        // If DB save fails, clean up the uploaded file
        await supabase.storage.from('content-media').remove([fileName])

        toast.error(t('upload.image.errorToast'), {
          description: result.error || t('upload.image.errorDescription'),
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
          console.error('[Image Upload] Cleanup error:', cleanupError)
        }
      }

      console.error('[Image Upload] Unexpected error:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error(t('upload.image.unexpectedErrorToast'), {
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
      {!preview ? (
        <>
          {/* Drop Zone */}
          <div {...getRootProps()}>
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(212, 165, 165, 0.25)' }}
              whileTap={{ scale: 0.98 }}
              animate={isDragActive ? {
                scale: [1, 1.02, 1],
                borderColor: ['#9D4EDD', '#FFB6C1', '#9D4EDD']
              } : {}}
              transition={{ duration: 0.3 }}
              className={`border-3 border-dashed rounded-2xl p-10 md:p-16 text-center cursor-pointer transition-all bg-gradient-to-br ${
                isDragActive
                  ? 'border-birthday-purple from-birthday-purple/10 to-birthday-blush/10'
                  : 'border-gray-300 hover:border-birthday-rose-gold from-birthday-champagne/20 to-white hover:from-birthday-champagne/40 hover:to-birthday-cream/20'
              }`}
            >
              <input {...getInputProps()} />
            <motion.div
              className="space-y-4"
              animate={isDragActive ? { y: [0, -8, 0] } : {}}
              transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
            >
              <motion.div
                className="text-8xl md:text-9xl"
                animate={{ rotate: isDragActive ? [0, -10, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
              >
                📸
              </motion.div>
              {isDragActive ? (
                <p className="text-lg font-medium text-birthday-purple">
                  {t('upload.image.dragActive')}
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    {isMobile ? t('upload.image.dragDropLabelMobile') : t('upload.image.dragDropLabel')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isMobile ? t('upload.image.dragDropHintMobile') : t('upload.image.dragDropHint')} • Max 10MB • {t('upload.image.fileTypeHint')}
                  </p>
                </>
              )}
            </motion.div>
            </motion.div>
          </div>

          {/* Camera Access Button (Mobile) */}
          {isMobile && cameraAvailable && (
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(157, 78, 221, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-dashed border-birthday-purple/40 rounded-xl p-8 text-center bg-gradient-to-br from-birthday-purple/5 to-white"
            >
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
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <motion.div
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-birthday-purple to-birthday-blush rounded-full flex items-center justify-center shadow-lg"
                >
                  <Camera className="w-10 h-10 text-white" />
                </motion.div>
                <span className="text-base font-semibold text-birthday-purple">{t('upload.image.cameraButton')}</span>
                <span className="text-xs text-muted-foreground">{t('upload.image.cameraHint')}</span>
              </label>
            </motion.div>
          )}

          {/* Alternative: File Picker Button (Mobile) */}
          {isMobile && (
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(255, 182, 193, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-dashed border-birthday-rose-gold/40 rounded-xl p-8 text-center bg-gradient-to-br from-birthday-blush/5 to-white"
            >
              <input
                ref={mobileFileInputRef}
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
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-birthday-rose-gold to-birthday-blush rounded-full flex items-center justify-center shadow-lg"
                >
                  <ImageIcon className="w-10 h-10 text-white" />
                </motion.div>
                <span className="text-base font-semibold text-birthday-rose-gold">{t('upload.image.filePickerButton')}</span>
                <span className="text-xs text-muted-foreground">{t('upload.image.filePickerHint')}</span>
              </label>
            </motion.div>
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
              aria-label={t('upload.image.removeImageAriaLabel')}
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
              {progress < 30 ? t('upload.image.preparingProgress') : progress < 70 ? t('upload.image.uploadingProgress') : t('upload.image.finalizingProgress')}
            </p>
            <p className={`${isMobile ? 'text-base font-semibold' : 'text-sm'} text-birthday-purple`}>
              {progress}%
            </p>
          </div>
        </div>
      )}

      <motion.button
        type="submit"
        disabled={!file || loading}
        whileHover={{ scale: file && !loading ? 1.02 : 1 }}
        whileTap={{ scale: file && !loading ? 0.98 : 1 }}
        className="w-full h-14 rounded-md bg-gradient-to-r from-birthday-rose-gold via-birthday-blush to-birthday-purple px-6 py-3 text-base font-medium text-white hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 touch-manipulation"
      >
        {loading && <Spinner size="sm" className="text-white" />}
        {loading ? t('upload.image.submittingButton') : t('upload.image.submitButton')}
      </motion.button>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>{t('upload.image.pendingApprovalNote')}</p>
        <p>{t('upload.infoMessage.contact', { email: 'pierluigibaiano@gmail.com' })}</p>
      </div>
    </form>
  )
}
