import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadTabs } from '@/components/upload/UploadTabs'
import { UploadErrorBoundary } from '@/components/errors/UploadErrorBoundary'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Carica il tuo messaggio',
  description: 'Condividi un messaggio, foto o video per il compleanno di Giuliana',
  openGraph: {
    title: 'Carica il tuo messaggio - Guestbook Giuliana 40',
    description: 'Condividi i tuoi auguri con messaggi, foto e video',
    type: 'website',
  },
}

export default async function UploadPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is guest
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string } | null }

  if (profile?.role !== 'guest') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-pink/10 via-birthday-purple/10 to-birthday-gold/10">
      <Header userName={profile?.full_name} userRole={profile?.role} />

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-birthday-rose-gold via-birthday-blush to-birthday-purple bg-clip-text text-transparent">
            Lascia un segno speciale ✨
          </h1>
          <p className="text-muted-foreground">
            Ciao {profile?.full_name}! Regala un ricordo indimenticabile per i 40 anni di Giuliana 🎂💝
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <UploadErrorBoundary>
            <UploadTabs userId={user.id} />
          </UploadErrorBoundary>
        </div>
      </div>
    </div>
  )
}
