import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if user has exceeded rate limit for uploads (1 upload per minute)
 * Uses localStorage to track last upload time client-side
 * Returns { allowed: boolean, remainingSeconds?: number }
 */
export function checkUploadRateLimit(userId: string): { allowed: boolean; remainingSeconds?: number } {
  const lastUploadKey = `last_upload_${userId}`
  const lastUploadStr = localStorage.getItem(lastUploadKey)

  if (lastUploadStr) {
    const lastUpload = parseInt(lastUploadStr)
    const elapsed = Date.now() - lastUpload
    const oneMinute = 60 * 1000

    if (elapsed < oneMinute) {
      const remainingSeconds = Math.ceil((oneMinute - elapsed) / 1000)
      return { allowed: false, remainingSeconds }
    }
  }

  // Update last upload time
  localStorage.setItem(lastUploadKey, Date.now().toString())
  return { allowed: true }
}
