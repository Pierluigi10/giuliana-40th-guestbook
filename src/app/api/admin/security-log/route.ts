import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// In-memory storage for blocked attempts (shared with register route)
interface BlockedAttempt {
  timestamp: number
  ip: string
  email: string
  reason: 'honeypot' | 'rate_limit'
  userAgent?: string
}

// This will be populated by the register route
// Note: This is a simple in-memory solution. For production at scale, consider a database table.
const blockedAttemptsStore: BlockedAttempt[] = []

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null; error: unknown }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profilo non trovato' },
        { status: 404 }
      )
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo gli amministratori possono accedere a questi dati' },
        { status: 403 }
      )
    }

    // Import the blocked attempts from the register route
    // This is a workaround since we can't directly access the variable from another route
    // In a real production app, you'd want to use a shared state management solution or database
    const registerModule = await import('@/app/api/auth/register/route')
    const blockedAttempts =
      typeof registerModule.getBlockedAttempts === 'function'
        ? registerModule.getBlockedAttempts()
        : []

    // Calculate statistics
    const stats = {
      total: blockedAttempts.length,
      honeypot: blockedAttempts.filter((a) => a.reason === 'honeypot').length,
      rateLimit: blockedAttempts.filter((a) => a.reason === 'rate_limit')
        .length,
      last24h: blockedAttempts.filter(
        (a) => Date.now() - a.timestamp < 24 * 60 * 60 * 1000
      ).length,
      lastHour: blockedAttempts.filter(
        (a) => Date.now() - a.timestamp < 60 * 60 * 1000
      ).length,
    }

    // Format attempts for display
    const formattedAttempts = blockedAttempts.slice(0, 50).map((attempt) => ({
      ...attempt,
      timestampFormatted: new Date(attempt.timestamp).toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      reasonLabel:
        attempt.reason === 'honeypot'
          ? 'Bot (honeypot)'
          : 'Rate limit superato',
    }))

    return NextResponse.json({
      stats,
      attempts: formattedAttempts,
    })
  } catch (error) {
    console.error('Security log error:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei log di sicurezza' },
      { status: 500 }
    )
  }
}
