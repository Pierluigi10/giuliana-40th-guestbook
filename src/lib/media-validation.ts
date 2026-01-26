/**
 * Server-side media validation utilities
 * Ensures uploaded files meet security and size requirements
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET_NAME = 'content-media'

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024 // 20MB (increased from 10MB)

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm'
]

interface ValidationResult {
  valid: boolean
  error?: string
  metadata?: {
    size: number
    mimeType: string
    fileName: string
  }
}

/**
 * Validates that a media URL belongs to our Supabase bucket
 */
export function validateMediaUrl(mediaUrl: string): { valid: boolean; error?: string; filePath?: string } {
  try {
    const url = new URL(mediaUrl)

    // Check if URL is from our Supabase project
    if (!url.hostname.includes('supabase.co')) {
      return { valid: false, error: 'URL non valido: deve provenire da Supabase Storage' }
    }

    // Extract file path from URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/content-media/{path}
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/content-media\/(.+)/)

    if (!pathMatch || !pathMatch[1]) {
      return { valid: false, error: 'URL non valido: percorso file mancante' }
    }

    const filePath = pathMatch[1]

    // Validate file path structure: should be {userId}/{filename}
    const pathParts = filePath.split('/')
    if (pathParts.length !== 2) {
      return { valid: false, error: 'URL non valido: struttura percorso non corretta' }
    }

    return { valid: true, filePath }
  } catch (error) {
    return { valid: false, error: 'URL malformato' }
  }
}

/**
 * Validates image file metadata from Supabase Storage
 */
export async function validateImageMetadata(mediaUrl: string, userId: string): Promise<ValidationResult> {
  try {
    // First validate URL format
    const urlValidation = validateMediaUrl(mediaUrl)
    if (!urlValidation.valid) {
      return { valid: false, error: urlValidation.error }
    }

    const filePath = urlValidation.filePath!

    // Verify file belongs to the user
    if (!filePath.startsWith(`${userId}/`)) {
      return { valid: false, error: 'Accesso negato: il file non appartiene all\'utente' }
    }

    // Create service role client to check file metadata (bypasses RLS)
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get file metadata from Storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(userId, {
        search: filePath.split('/')[1] // Get filename only
      })

    if (fileError) {
      console.error('[Media Validation] Storage error:', fileError)
      return { valid: false, error: 'Errore durante la verifica del file' }
    }

    if (!fileData || fileData.length === 0) {
      return { valid: false, error: 'File non trovato nello storage' }
    }

    const file = fileData[0]

    // Validate file size
    if (file.metadata.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `File troppo grande: ${(file.metadata.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`
      }
    }

    // Validate MIME type
    const mimeType = file.metadata.mimetype
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `Tipo di file non supportato: ${mimeType}. Usa: JPEG, PNG, GIF, WEBP`
      }
    }

    return {
      valid: true,
      metadata: {
        size: file.metadata.size,
        mimeType: file.metadata.mimetype,
        fileName: file.name
      }
    }
  } catch (error) {
    console.error('[Media Validation] Unexpected error:', error)
    return { valid: false, error: 'Errore durante la validazione del file' }
  }
}

/**
 * Validates video file metadata from Supabase Storage
 */
export async function validateVideoMetadata(mediaUrl: string, userId: string): Promise<ValidationResult> {
  try {
    // First validate URL format
    const urlValidation = validateMediaUrl(mediaUrl)
    if (!urlValidation.valid) {
      return { valid: false, error: urlValidation.error }
    }

    const filePath = urlValidation.filePath!

    // Verify file belongs to the user
    if (!filePath.startsWith(`${userId}/`)) {
      return { valid: false, error: 'Accesso negato: il file non appartiene all\'utente' }
    }

    // Create service role client to check file metadata (bypasses RLS)
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get file metadata from Storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(userId, {
        search: filePath.split('/')[1] // Get filename only
      })

    if (fileError) {
      console.error('[Media Validation] Storage error:', fileError)
      return { valid: false, error: 'Errore durante la verifica del file' }
    }

    if (!fileData || fileData.length === 0) {
      return { valid: false, error: 'File non trovato nello storage' }
    }

    const file = fileData[0]

    // Validate file size
    if (file.metadata.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: `File troppo grande: ${(file.metadata.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`
      }
    }

    // Validate MIME type
    const mimeType = file.metadata.mimetype
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `Tipo di file non supportato: ${mimeType}. Usa: MP4, MOV, WEBM`
      }
    }

    return {
      valid: true,
      metadata: {
        size: file.metadata.size,
        mimeType: file.metadata.mimetype,
        fileName: file.name
      }
    }
  } catch (error) {
    console.error('[Media Validation] Unexpected error:', error)
    return { valid: false, error: 'Errore durante la validazione del file' }
  }
}
