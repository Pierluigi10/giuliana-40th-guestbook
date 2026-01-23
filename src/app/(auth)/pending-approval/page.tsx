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

export default async function PendingApprovalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is approved now
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; is_approved: boolean; full_name: string } | null }

  // If approved, redirect to appropriate page
  if (profile?.is_approved) {
    if (profile.role === 'admin') {
      redirect('/admin/approve-users')
    } else if (profile.role === 'vip') {
      redirect('/vip/gallery')
    } else if (profile.role === 'guest') {
      redirect('/guest/upload')
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold">In attesa di approvazione</h1>
          <p className="mt-2 text-muted-foreground">
            Ciao {profile?.full_name || 'ospite'}!
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            La tua registrazione è stata ricevuta con successo.
            Un amministratore deve approvare il tuo account prima che tu possa
            accedere al guestbook.
          </p>
          <p className="text-sm text-muted-foreground">
            Riceverai una notifica via email quando il tuo account sarà approvato.
          </p>
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
