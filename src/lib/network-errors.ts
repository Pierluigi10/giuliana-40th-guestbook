/**
 * Network Error Handling Utilities
 *
 * Provides user-friendly error messages and retry logic for network operations
 */

export type NetworkErrorType =
  | 'connection'
  | 'timeout'
  | 'server'
  | 'authentication'
  | 'rate_limit'
  | 'validation'
  | 'unknown'

export interface NetworkErrorInfo {
  type: NetworkErrorType
  message: string
  userMessage: string
  canRetry: boolean
  retryDelay?: number
}

/**
 * Analyzes an error and returns user-friendly information
 */
export function analyzeNetworkError(error: unknown): NetworkErrorInfo {
  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'connection',
      message: error.message,
      userMessage: 'Controlla la connessione internet e riprova',
      canRetry: true,
      retryDelay: 2000
    }
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Request timeout',
      userMessage: 'Il caricamento sta impiegando più tempo del solito. Riprova tra un momento',
      canRetry: true,
      retryDelay: 3000
    }
  }

  // Handle HTTP errors from Response objects
  if (error && typeof error === 'object' && 'status' in error) {
    const response = error as Response

    if (response.status === 401 || response.status === 403) {
      return {
        type: 'authentication',
        message: 'Authentication failed',
        userMessage: 'Sessione scaduta. Effettua di nuovo l\'accesso',
        canRetry: false
      }
    }

    if (response.status === 429) {
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        userMessage: 'Troppi tentativi. Attendi un momento prima di riprovare',
        canRetry: true,
        retryDelay: 5000
      }
    }

    if (response.status >= 500) {
      return {
        type: 'server',
        message: `Server error: ${response.status}`,
        userMessage: 'C\'è un problema temporaneo con il server. Riprova tra un momento',
        canRetry: true,
        retryDelay: 3000
      }
    }

    if (response.status >= 400 && response.status < 500) {
      return {
        type: 'validation',
        message: `Client error: ${response.status}`,
        userMessage: 'Verifica i dati inseriti e riprova',
        canRetry: false
      }
    }
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string }

    if (supabaseError.code === 'PGRST116') {
      return {
        type: 'connection',
        message: supabaseError.message,
        userMessage: 'Problema di connessione al database. Riprova tra un momento',
        canRetry: true,
        retryDelay: 2000
      }
    }

    if (supabaseError.code === '23505') {
      return {
        type: 'validation',
        message: 'Duplicate entry',
        userMessage: 'Questo elemento esiste già',
        canRetry: false
      }
    }
  }

  // Generic error
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: 'Si è verificato un errore imprevisto. Riprova tra un momento',
    canRetry: true,
    retryDelay: 2000
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    initialDelay = 1000,
    maxDelay = 5000,
    onRetry
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        const errorInfo = analyzeNetworkError(error)

        // Don't retry if error is not retryable
        if (!errorInfo.canRetry) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        )

        onRetry?.(attempt + 1, error)

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Fetch with timeout and retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & {
    timeout?: number
    maxRetries?: number
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<Response> {
  const { timeout = 30000, maxRetries = 2, onRetry, ...fetchOptions } = options

  return retryWithBackoff(
    async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        })

        if (!response.ok) {
          throw response
        }

        return response
      } finally {
        clearTimeout(timeoutId)
      }
    },
    {
      maxRetries,
      onRetry
    }
  )
}

/**
 * Upload file with progress tracking and retry
 */
export async function uploadWithRetry(
  supabaseUpload: () => Promise<{ data: any; error: any }>,
  options: {
    maxRetries?: number
    onProgress?: (progress: number) => void
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<{ data: any; error: any }> {
  const { maxRetries = 2, onRetry } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await supabaseUpload()

      if (!result.error) {
        return result
      }

      // Check if error is retryable
      const errorInfo = analyzeNetworkError(result.error)
      if (!errorInfo.canRetry && attempt === 0) {
        return result
      }

      lastError = result.error

      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, result.error)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, error)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  return { data: null, error: lastError }
}

/**
 * Format user-friendly error message
 */
export function formatErrorMessage(error: unknown, context?: string): string {
  const errorInfo = analyzeNetworkError(error)

  if (context) {
    return `${errorInfo.userMessage} (${context})`
  }

  return errorInfo.userMessage
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  return analyzeNetworkError(error).canRetry
}

/**
 * Get suggested retry delay
 */
export function getRetryDelay(error: unknown): number {
  return analyzeNetworkError(error).retryDelay || 2000
}
