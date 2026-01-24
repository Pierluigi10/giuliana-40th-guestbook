import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Create admin client with service role key for auto-confirming emails
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Rate limiting - in-memory store (resets on server restart)
// For production with multiple instances, consider Redis
interface RateLimitEntry {
  count: number
  firstAttempt: number
}

interface BlockedAttempt {
  timestamp: number
  ip: string
  email: string
  reason: 'honeypot' | 'rate_limit'
  userAgent?: string
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const blockedAttempts: BlockedAttempt[] = []
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_REGISTRATIONS_PER_IP = 5
const MAX_BLOCKED_ATTEMPTS_LOG = 100 // Keep last 100 blocked attempts

// Email notification batching
const EMAIL_BATCH_THRESHOLD = 3 // Send email after 3 blocked attempts
const EMAIL_COOLDOWN_MS = 10 * 60 * 1000 // Min 10 minutes between emails
let lastEmailSentAt = 0
let pendingEmailAttempts: BlockedAttempt[] = []

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    // First attempt from this IP
    rateLimitMap.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  // Check if the window has expired
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    // Reset the window
    rateLimitMap.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  // Check if the limit has been reached
  if (entry.count >= MAX_REGISTRATIONS_PER_IP) {
    return false
  }

  // Increment the count
  entry.count++
  return true
}

function getClientIp(request: Request): string {
  // Try to get IP from various headers (considering proxies, load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to a default (not ideal, but better than nothing)
  return 'unknown'
}

async function sendBatchedEmailNotification() {
  if (pendingEmailAttempts.length === 0) {
    return
  }

  const now = Date.now()
  const timeSinceLastEmail = now - lastEmailSentAt

  // Check if enough time has passed since last email
  if (timeSinceLastEmail < EMAIL_COOLDOWN_MS) {
    console.log(
      `[EMAIL] Skipping email notification, cooldown active (${Math.round((EMAIL_COOLDOWN_MS - timeSinceLastEmail) / 1000)}s remaining)`
    )
    return
  }

  try {
    const { sendSpamNotification } = await import('@/lib/email')
    await sendSpamNotification([...pendingEmailAttempts])
    lastEmailSentAt = now
    pendingEmailAttempts = [] // Clear pending attempts after successful send
    console.log('[EMAIL] Spam notification email sent successfully')
  } catch (error) {
    console.error('[EMAIL] Failed to send spam notification email:', error)
    // Don't throw - registration blocking should work even if email fails
  }
}

function logBlockedAttempt(
  ip: string,
  email: string,
  reason: 'honeypot' | 'rate_limit',
  userAgent?: string
) {
  const attempt: BlockedAttempt = {
    timestamp: Date.now(),
    ip,
    email,
    reason,
    userAgent,
  }

  blockedAttempts.unshift(attempt)

  // Keep only last MAX_BLOCKED_ATTEMPTS_LOG attempts
  if (blockedAttempts.length > MAX_BLOCKED_ATTEMPTS_LOG) {
    blockedAttempts.pop()
  }

  // Log to console with timestamp
  console.warn(
    `[SPAM BLOCKED] ${new Date().toISOString()} | Reason: ${reason} | IP: ${ip} | Email: ${email}`
  )

  // Add to pending email batch
  pendingEmailAttempts.push(attempt)

  // Send email notification if threshold reached
  if (pendingEmailAttempts.length >= EMAIL_BATCH_THRESHOLD) {
    // Send email asynchronously without blocking the response
    sendBatchedEmailNotification().catch((error) => {
      console.error('[EMAIL] Error in sendBatchedEmailNotification:', error)
    })
  }
}

// Export function to get blocked attempts (for admin dashboard)
export function getBlockedAttempts(): BlockedAttempt[] {
  return blockedAttempts
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, website } = await request.json()
    const clientIp = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Honeypot check - if filled, it's a bot
    if (website) {
      logBlockedAttempt(clientIp, email || 'unknown', 'honeypot', userAgent)
      return NextResponse.json(
        { error: 'Registrazione non valida' },
        { status: 400 }
      )
    }

    // Rate limiting check
    if (!checkRateLimit(clientIp)) {
      logBlockedAttempt(clientIp, email || 'unknown', 'rate_limit', userAgent)
      return NextResponse.json(
        { error: 'Troppe registrazioni. Riprova tra 10 minuti.' },
        { status: 429 }
      )
    }

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno 6 caratteri' },
        { status: 400 }
      )
    }

    if (fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Inserisci nome e cognome validi' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Create user with auto-confirmed email
    const { data, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (signUpError) {
      // Handle specific errors
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Questa email è già registrata. Prova ad accedere o recupera la password.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Errore durante la creazione dell\'utente' },
        { status: 500 }
      )
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Si è verificato un errore durante la registrazione' },
      { status: 500 }
    )
  }
}
