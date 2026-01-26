/**
 * Utility functions for mobile device detection and optimization
 */

/**
 * Check if the current device is a mobile device
 * Uses user agent and screen size to detect mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  const isMobileUA = mobileRegex.test(userAgent)

  // Check screen size (mobile typically < 768px)
  const isMobileScreen = window.innerWidth < 768

  // Check for touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return isMobileUA || (isMobileScreen && hasTouch)
}

/**
 * Check if camera access is available
 */
export function isCameraAvailable(): boolean {
  if (typeof navigator === 'undefined') return false
  return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
}

/**
 * Get optimal image compression settings based on device type
 */
export function getImageCompressionOptions(isMobile: boolean) {
  if (isMobile) {
    // More aggressive compression for mobile devices
    return {
      maxSizeMB: 0.8, // Smaller max size for mobile
      maxWidthOrHeight: 1600, // Lower resolution for mobile
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.85, // Slightly lower quality for mobile
    }
  }

  // Desktop settings
  return {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.9,
  }
}

/**
 * Get video recording constraints with lowest quality settings
 * This ensures videos are recorded at the lowest quality to reduce file size
 * @param facingMode - 'user' for front camera (default), 'environment' for back camera
 */
export function getLowQualityVideoConstraints(facingMode: 'user' | 'environment' = 'user'): MediaStreamConstraints {
  return {
    video: {
      facingMode: { ideal: facingMode }, // Use 'ideal' for better browser compatibility - 'user' = front camera, 'environment' = back camera
      width: { ideal: 480 }, // Low resolution width
      height: { ideal: 360 }, // Low resolution height
      frameRate: { ideal: 15 }, // Lower frame rate (15fps instead of 30fps)
      // Use advanced constraints to force lowest quality
      advanced: [
        { width: { max: 640 } }, // Max width 640px
        { height: { max: 480 } }, // Max height 480px
        { frameRate: { max: 15 } }, // Max 15fps
      ],
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000, // Lower audio sample rate (16kHz instead of 48kHz)
    },
  }
}
