'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { saveVideoContentRecord } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import { checkUploadRateLimit } from '@/lib/utils'
import { isMobileDevice, isCameraAvailable, getLowQualityVideoConstraints } from '@/lib/mobile-utils'
import { Camera, Video, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { analyzeNetworkError, uploadWithRetry } from '@/lib/network-errors'
import { compressVideo } from '@/lib/video-compression'

interface VideoUploadProps {
  userId: string
}

// Debug logging helpers - only log in development
const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

const debugWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args)
  }
}

export function VideoUpload({ userId }: VideoUploadProps) {
  const t = useTranslations()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [cameraAvailable, setCameraAvailable] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [estimatedSize, setEstimatedSize] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const maxSize = 20 * 1024 * 1024 // 20MB (increased from 15MB)

  useEffect(() => {
    setIsMobile(isMobileDevice())
    setCameraAvailable(isCameraAvailable())
  }, [])

  useEffect(() => {
    abortControllerRef.current = new AbortController()
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    // Cleanup function that revokes the object URL when preview changes or component unmounts
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])

  // Ensure video preview shows the stream during recording (fix black screen)
  useEffect(() => {
    if ((showPreview || isRecording) && mediaStreamRef.current && videoPreviewRef.current) {
      debugLog('[VideoUpload] Ensuring video element has stream:', {
        showPreview,
        isRecording,
        hasStream: !!mediaStreamRef.current,
        hasVideoElement: !!videoPreviewRef.current
      })

      // Make sure the video element has the stream
      if (videoPreviewRef.current.srcObject !== mediaStreamRef.current) {
        debugLog('[VideoUpload] Re-attaching stream to video element')
        videoPreviewRef.current.srcObject = mediaStreamRef.current
        videoPreviewRef.current.play().catch(err => {
          console.error('[VideoUpload] Error playing video:', err)
        })
      }
    }
  }, [showPreview, isRecording])

  // Auto-stop recording after 1 minute (60 seconds)
  useEffect(() => {
    if (isRecording && recordingTime === 50) {
      toast.warning(t('upload.video.tenSecondWarningTitle'), {
        description: t('upload.video.tenSecondWarningDescription')
      })
    }
    if (isRecording && recordingTime >= 60) {
      stopRecording()
      toast.info(t('upload.video.limitReachedTitle'), {
        description: t('upload.video.limitReachedDescription')
      })
    }
  }, [isRecording, recordingTime, t])

  // Calculate estimated file size based on recording time and bitrate
  useEffect(() => {
    if (isRecording && recordingTime > 0) {
      // Bitrate: 750 kbps video + ~64 kbps audio = ~814 kbps total
      // Convert to bytes per second: 814000 bits/s = 101750 bytes/s
      const bytesPerSecond = 101750
      const estimated = recordingTime * bytesPerSecond
      setEstimatedSize(estimated)
    } else {
      setEstimatedSize(0)
    }
  }, [isRecording, recordingTime])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > maxSize) {
      toast.error(t('upload.video.fileTooLargeTitle'), {
        description: t('upload.video.fileTooLargeDescription')
      })
      return
    }

    if (!file.type.startsWith('video/')) {
      toast.error(t('upload.video.formatNotSupportedTitle'), {
        description: t('upload.video.formatNotSupportedDescription')
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning(t('upload.video.largeVideoTitle'), {
        description: t('upload.video.largeVideoDescription')
      })
    }

    setFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [t])

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
      toast.error(t('upload.video.fileTooLargeTitle'), {
        description: t('upload.video.fileTooLargeDescription')
      })
      return
    }

    if (!selectedFile.type.startsWith('video/')) {
      toast.error(t('upload.video.formatNotSupportedTitle'), {
        description: t('upload.video.formatNotSupportedDescription')
      })
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.warning(t('upload.video.largeVideoTitle'), {
        description: t('upload.video.largeVideoDescription')
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

  const startPreview = async () => {
    debugLog('[VideoUpload] startPreview called', {
      showPreview,
      isRecording,
      facingMode,
      isInitializing
    })

    setIsInitializing(true)

    try {
      const constraints = getLowQualityVideoConstraints(facingMode)
      debugLog('[VideoUpload] Requesting camera with constraints:', constraints)

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      debugLog('[VideoUpload] Camera stream obtained:', {
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          label: t.label,
          settings: t.getSettings()
        }))
      })

      mediaStreamRef.current = stream

      // Show video preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        await videoPreviewRef.current.play()
      }

      setShowPreview(true)
      debugLog('[VideoUpload] Preview started successfully')
    } catch (error) {
      console.error('[VideoUpload] Error starting camera preview:', error)
      toast.error(t('upload.video.cameraPermissionErrorTitle'), {
        description: t('upload.video.cameraPermissionErrorDescription')
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const switchCamera = async () => {
    debugLog('[VideoUpload] switchCamera called', {
      currentFacingMode: facingMode,
      isRecording,
      showPreview
    })

    // Prevent switching camera during recording
    if (isRecording) {
      debugWarn('[VideoUpload] Cannot switch camera while recording')
      toast.warning(t('upload.video.cannotSwitchTitle'), {
        description: t('upload.video.cannotSwitchDescription')
      })
      return
    }

    setIsInitializing(true)

    try {
      // Stop current stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      // Switch facing mode
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
      setFacingMode(newFacingMode)
      debugLog('[VideoUpload] Switching to camera:', newFacingMode)

      // Restart preview with new camera
      if (showPreview) {
        const constraints = getLowQualityVideoConstraints(newFacingMode)
        debugLog('[VideoUpload] Requesting new camera with constraints:', constraints)

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        debugLog('[VideoUpload] New camera stream obtained')

        mediaStreamRef.current = stream

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream
          await videoPreviewRef.current.play()
        }

        debugLog('[VideoUpload] Camera switched successfully to:', newFacingMode)
      }
    } catch (error) {
      console.error('[VideoUpload] Error switching camera:', error)
      toast.error(t('upload.video.switchCameraErrorTitle'), {
        description: t('upload.video.switchCameraErrorDescription')
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const startRecording = async () => {
    debugLog('[VideoUpload] startRecording called', {
      hasStream: !!mediaStreamRef.current,
      showPreview,
      isRecording,
      facingMode
    })

    if (!mediaStreamRef.current) {
      console.error('[VideoUpload] No media stream available')
      toast.error(t('upload.video.previewNotAvailableTitle'), {
        description: t('upload.video.previewNotAvailableDescription')
      })
      return
    }

    setIsInitializing(true)

    try {
      recordedChunksRef.current = []

      // Create MediaRecorder with low bitrate
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

      debugLog('[VideoUpload] Creating MediaRecorder with mimeType:', mimeType)

      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType,
        videoBitsPerSecond: 750000, // Moderate bitrate: 750 kbps (was 250 kbps) - better quality while keeping file size reasonable
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        debugLog('[VideoUpload] MediaRecorder stopped, processing recording...')
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })
        debugLog('[VideoUpload] Recording blob size:', blob.size, 'bytes')

        const fileName = `video-${Date.now()}.${mimeType.includes('webm') ? 'webm' : 'mp4'}`
        const file = new File([blob], fileName, { type: mimeType })

        handleFileSelect(file)

        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
          mediaStreamRef.current = null
        }

        setIsRecording(false)
        setShowPreview(false)
        setRecordingTime(0)
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      debugLog('[VideoUpload] MediaRecorder started', {
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType
      })

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success(t('upload.video.recordingStartedTitle'), {
        description: t('upload.video.recordingStartedDescription')
      })
    } catch (error) {
      console.error('[VideoUpload] Error starting video recording:', error)
      toast.error(t('upload.video.recordingErrorTitle'), {
        description: t('upload.video.recordingErrorDescription')
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
    
    setIsRecording(false)
    setShowPreview(false)
    setRecordingTime(0)
    setEstimatedSize(0)
    recordedChunksRef.current = []

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
  }

  const closePreview = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
    
    setShowPreview(false)
    setIsRecording(false)
    setRecordingTime(0)
    setEstimatedSize(0)
    recordedChunksRef.current = []
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
  }

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setProgress(0)
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = ''

    // Cleanup recording state
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    setEstimatedSize(0)
    recordedChunksRef.current = []
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error(t('upload.video.selectVideoTitle'), {
        description: t('upload.video.selectVideoDescription')
      })
      return
    }

    // Check client-side rate limit
    const rateLimitCheck = checkUploadRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      toast.error(t('upload.video.rateLimitTitle'), {
        description: t('upload.video.rateLimitDescription', { remainingSeconds: rateLimitCheck.remainingSeconds || 60 })
      })
      return
    }

    setLoading(true)
    setProgress(5)

    let fileToUpload = file
    let compressionSkipped = false

    // STEP 1: Comprimi video se > 10MB
    if (file.size > 10 * 1024 * 1024) {
      setIsCompressing(true)
      setProgress(5)

      toast.info(t('upload.video.compressingVideoTitle'), {
        description: t('upload.video.compressingVideoDescription')
      })

      try {
        debugLog('[Video Upload] Starting compression...')

        fileToUpload = await compressVideo(file, {
          quality: 'medium',
          onProgress: (prog) => {
            setCompressionProgress(prog)
            setProgress(5 + (prog * 0.4)) // 5% → 45%
          }
        })

        setIsCompressing(false)
        setProgress(50)

        const originalMB = (file.size / 1024 / 1024).toFixed(2)
        const compressedMB = (fileToUpload.size / 1024 / 1024).toFixed(2)

        toast.success(t('upload.video.compressedTitle'), {
          description: t('upload.video.compressedDescription', { originalMB, compressedMB })
        })

      } catch (compressionError) {
        console.error('[Video Upload] Compression failed:', compressionError)

        toast.warning(t('upload.video.compressionFailedTitle'), {
          description: t('upload.video.compressionFailedDescription')
        })

        fileToUpload = file
        compressionSkipped = true
        setIsCompressing(false)
        setProgress(10)
      }
    } else {
      setProgress(10)
    }

    // Validate file size after compression (must be < 20MB)
    if (fileToUpload.size > 20 * 1024 * 1024) {
      toast.error(t('upload.video.stillTooLargeTitle'), {
        description: compressionSkipped
          ? t('upload.video.stillTooLargeDescription')
          : t('upload.video.stillTooLargeDescriptionAfterCompress')
      })
      setLoading(false)
      setIsCompressing(false)
      return
    }

    let fileName = ''

    try {
      // STEP 2: Upload to Supabase Storage
      const supabase = createClient()

      // Generate unique filename
      const fileExt = fileToUpload.name.split('.').pop()
      fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      debugLog('[Video Upload] Starting direct upload to Supabase Storage...')

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
          onRetry: (attempt) => {
            debugLog(`[Video Upload] Retry attempt ${attempt}/3...`)
            toast.info(t('upload.video.uploadErrorDescription'), {
              description: t('upload.video.uploadErrorAttempt', { attempt })
            })
          }
        }
      )

      if (uploadResult.error) {
        console.error('[Video Upload] Storage upload error:', uploadResult.error)
        const errorInfo = analyzeNetworkError(uploadResult.error)
        toast.error(t('upload.video.uploadErrorTitle'), {
          description: errorInfo.userMessage
        })
        setProgress(0)
        setLoading(false)
        return
      }

      setProgress(70)
      debugLog('[Video Upload] File uploaded successfully to Storage')

      // Check if operation was aborted before proceeding
      if (abortControllerRef.current?.signal.aborted) {
        debugLog('[Video Upload] Operation aborted, cleaning up...')
        await supabase.storage.from('content-media').remove([fileName])
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName)

      debugLog('[Video Upload] Public URL:', publicUrl)
      setProgress(80)

      // Save content record to database via server action
      let result
      try {
        result = await saveVideoContentRecord(publicUrl)
      } catch (error) {
        console.error('[Video Upload] Server action error:', error)
        const errorInfo = analyzeNetworkError(error)
        toast.error(t('upload.video.saveErrorTitle'), {
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
          ? t('upload.video.firstVideoToast')
          : t('upload.video.multipleContentToast', { count })

        // Celebration confetti!
        const colors = ['#FF69B4', '#9D4EDD', '#FFD700']
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.5, y: 0.5 },
          colors,
        })

        toast.success(t('upload.video.successToast'), {
          description: t('upload.video.successDescription', { countMessage }),
          duration: 6000
        })
        handleRemove()
        setProgress(100)
      } else {
        // If DB save fails, clean up the uploaded file
        await supabase.storage.from('content-media').remove([fileName])

        toast.error(t('upload.video.errorToast'), {
          description: result.error || t('upload.video.errorDescription'),
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
      toast.error(t('upload.video.unexpectedErrorToast'), {
        description: errorInfo.userMessage
      })
      setProgress(0)
    } finally {
      setLoading(false)
      setIsCompressing(false)
      setCompressionProgress(0)
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
              <input {...getInputProps()} />
              <div className="space-y-3">
                <div className="text-6xl">🎥</div>
                {isDragActive ? (
                  <p className="text-lg font-medium text-birthday-purple">
                    {t('upload.video.dragActive')}
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-medium">
                      {t('upload.video.dragDropLabel')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('upload.video.fileTypeHint')}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile Camera Access - Video Recording */}
          {isMobile && cameraAvailable && (
            <div className="space-y-4">
              {!showPreview && !isRecording ? (
                <div className="border-2 border-dashed border-birthday-purple/50 rounded-lg p-8 text-center bg-gradient-to-br from-birthday-pink/5 to-birthday-purple/5">
                  <button
                    type="button"
                    onClick={startPreview}
                    disabled={isInitializing}
                    className="flex flex-col items-center gap-3 w-full disabled:opacity-50"
                  >
                    <div className="bg-birthday-purple/10 p-4 rounded-full">
                      <Camera className="w-10 h-10 text-birthday-purple" />
                    </div>
                    <span className="text-base font-semibold text-foreground">
                      {isInitializing ? t('upload.video.previewLoading') : t('upload.video.previewTitle')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t('upload.video.previewHint')}
                    </span>
                  </button>
                </div>
              ) : showPreview && !isRecording ? (
                <div className="space-y-4">
                  {/* Video Preview Before Recording */}
                  <div className="relative rounded-lg overflow-hidden border-2 border-birthday-purple shadow-lg bg-black">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-auto max-h-[400px]"
                    />
                    {/* Camera Switch Button - Enlarged and more prominent */}
                    <button
                      type="button"
                      onClick={switchCamera}
                      disabled={isInitializing}
                      className="absolute top-3 right-3 bg-white/95 text-birthday-purple p-3 rounded-full hover:bg-white hover:scale-110 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Cambia camera"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                    {/* Camera Indicator - More prominent */}
                    <div className="absolute top-3 left-3 bg-birthday-purple/95 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                      <Camera className="w-4 h-4" />
                      {facingMode === 'user' ? t('upload.video.frontCamera') : t('upload.video.backCamera')}
                    </div>
                    {/* Helper text at bottom */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-xs text-center">
                      {t('upload.video.chooseCamera')}
                    </div>
                  </div>

                  {/* Preview Controls */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isInitializing}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                      <span className="text-base">
                        {isInitializing ? t('upload.video.preparingButton') : t('upload.video.startRecordingButton')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={closePreview}
                      disabled={isInitializing}
                      className="px-5 py-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      {t('upload.video.cancelButton')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Preview During Recording */}
                  <div className="relative rounded-lg overflow-hidden border-4 border-red-500 shadow-xl bg-black">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-auto max-h-[400px]"
                    />
                    {/* Recording Indicator - More prominent */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-bold">
                        REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    {/* Camera Indicator During Recording - DISABLED switch camera button */}
                    <div className="absolute top-3 right-3 bg-gray-600/90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg cursor-not-allowed">
                      <Camera className="w-4 h-4" />
                      {facingMode === 'user' ? t('upload.video.frontCamera') : t('upload.video.backCamera')}
                    </div>
                    {/* Estimated Size Indicator */}
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white px-4 py-2 rounded-full shadow-lg">
                      <span className="text-sm font-medium">
                        ~{(estimatedSize / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>

                  {/* Recording Controls */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      <span className="text-base">{t('upload.video.stopRecordingButton')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="px-5 py-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      {t('upload.video.cancelButton')}
                    </button>
                  </div>

                  {/* Recording Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 text-center space-y-2 border border-gray-200">
                    <p className="text-base font-semibold text-gray-800">
                      {recordingTime < 50 ? (
                        <>{t('upload.video.recordingTimeRemaining', { remainingSeconds: 60 - recordingTime })} <span className="text-birthday-purple text-lg"></span></>
                      ) : (
                        <span className="text-orange-600 text-lg">{t('upload.video.recordingTimeWarning', { remainingSeconds: 60 - recordingTime })}</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('upload.video.estimatedSize', { size: (estimatedSize / 1024 / 1024).toFixed(1) })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile File Picker */}
          {isMobile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={mobileFileInputRef}
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
                <span className="text-sm font-medium">{t('upload.video.galleryButton')}</span>
                <span className="text-xs text-muted-foreground">{t('upload.video.galleryHint')}</span>
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
              {t('upload.video.videoNotSupported')}
            </video>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label={t('upload.video.removeVideoAriaLabel')}
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

      {/* Compression Progress */}
      {isCompressing && (
        <div className="space-y-3 mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-birthday-gold via-birthday-purple to-birthday-pink h-full transition-all duration-300 ease-out"
              style={{ width: `${compressionProgress}%` }}
            />
          </div>
          <p className="text-sm text-center text-foreground font-medium">
            {t('upload.video.compressingTitle', { progress: compressionProgress })}
          </p>
          <p className="text-xs text-center text-muted-foreground">
            {t('upload.video.compressingDescription')}
          </p>
        </div>
      )}

      {/* Upload Progress Bar - Enhanced for Mobile */}
      {loading && !isCompressing && (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height: isMobile ? '8px' : '6px' }}>
            <div
              className="bg-gradient-to-r from-birthday-pink to-birthday-purple h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-center text-foreground`}>
              {progress < 30 ? t('upload.video.preparingProgress') : progress < 70 ? t('upload.video.uploadingProgress') : t('upload.video.finalizingProgress')}
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
        {loading ? t('upload.video.uploadingButton') : t('upload.video.submitButton')}
      </button>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>{t('upload.video.pendingApprovalNote')}</p>
        <p>{t('upload.infoMessage.contact', { email: 'pierluigibaiano@gmail.com' })}</p>
      </div>
    </form>
  )
}
