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
      width: { ideal: 640 }, // Slightly better resolution (was 480)
      height: { ideal: 480 }, // Slightly better resolution (was 360)
      frameRate: { ideal: 20 }, // Slightly better frame rate (was 15fps)
      // Use advanced constraints to allow moderate quality
      advanced: [
        { width: { max: 854 } }, // Max width 854px (480p)
        { height: { max: 480 } }, // Max height 480px
        { frameRate: { max: 24 } }, // Max 24fps (cinematic)
      ],
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 22050, // Better audio quality (was 16kHz, now 22kHz)
    },
  }
}
