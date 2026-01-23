import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'In attesa di approvazione',
  description: 'La tua registrazione è in attesa di approvazione da parte di un amministratore',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'In attesa di approvazione - Guestbook Giuliana 40',
    description: 'Account in attesa di approvazione',
    type: 'website',
  },
}

export default async function PendingApprovalPage({
  searchParams,
}: {
  searchParams: { mode?: string; email?: string }
}) {
  const supabase = await createClient()

  // Determine which message to show
  const isEmailConfirmation = searchParams.mode === 'email_confirmation'

  const { data: { user } } = await supabase.auth.getUser()

  // If email confirmation mode, allow access even without authentication
  if (!user && !isEmailConfirmation) {
    redirect('/login')
  }

  // Check if user is approved now (only if authenticated)
  let profile: { role: string; is_approved: boolean; full_name: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_approved, full_name')
      .eq('id', user.id)
      .single() as { data: { role: string; is_approved: boolean; full_name: string } | null }

    profile = data

    // If approved, redirect to appropriate page
    if (profile?.is_approved) {
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
            {isEmailConfirmation ? 'Controlla la tua email' : 'In attesa di approvazione'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ciao {profile?.full_name || 'ospite'}!
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          {isEmailConfirmation ? (
            <>
              <p className="text-sm text-muted-foreground">
                Ti abbiamo inviato un'email di conferma all'indirizzo{' '}
                <strong>{searchParams.email || user?.email || 'la tua email'}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Clicca sul link nella email per completare la registrazione e accedere
                al guestbook.
              </p>
              <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
                Non hai ricevuto l'email? Controlla la cartella spam o attendi qualche minuto.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                La tua registrazione è stata ricevuta con successo.
                Un amministratore deve approvare il tuo account prima che tu possa
                accedere al guestbook.
              </p>
              <p className="text-sm text-muted-foreground">
                Riceverai una notifica via email quando il tuo account sarà approvato.
              </p>
            </>
          )}
        </div>

        <div className="pt-4">
          <Link
            href="/login"
            className="text-sm text-birthday-purple hover:underline"
          >
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  )
}
