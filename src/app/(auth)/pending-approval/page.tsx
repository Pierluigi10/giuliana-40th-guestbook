import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.pendingApproval.metadata')

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
    },
  }
}

export default async function PendingApprovalPage({
  searchParams,
}: {
  searchParams: { mode?: string; email?: string }
}) {
  const supabase = await createClient()
  const t = await getTranslations('auth.pendingApproval')

  // Determine which message to show
  const isEmailConfirmation = searchParams.mode === 'email_confirmation'

  const { data: { user } } = await supabase.auth.getUser()

  // If email confirmation mode, allow access even without authentication
  if (!user && !isEmailConfirmation) {
    redirect('/login')
  }

  // Get user profile (only if authenticated)
  let profile: { role: string; full_name: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single() as { data: { role: string; full_name: string } | null }

    profile = data

    // If user is authenticated and has a role, redirect to appropriate page
    // After migration 004, all users with confirmed email are auto-approved
    if (profile) {
      if (profile.role === 'admin') {
        redirect('/approve-content')
      } else if (profile.role === 'vip') {
        redirect('/gallery')
      } else if (profile.role === 'guest') {
        redirect('/upload')
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-birthday-purple/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-birthday-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isEmailConfirmation ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            {isEmailConfirmation ? t('emailConfirmationTitle') : t('waitingApprovalTitle')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('greeting', { name: profile?.full_name || t('guestFallback') })}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          {isEmailConfirmation ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t('emailSentTo', { email: searchParams.email || user?.email || t('emailFallback') })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('clickLinkInstructions')}
              </p>
              <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
                {t('noEmailReceived')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t('registrationSuccess')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('checkEmailInstructions')}
              </p>
            </>
          )}
        </div>

        <div className="pt-4">
          <Link
            href="/login"
            className="text-sm text-birthday-purple hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
