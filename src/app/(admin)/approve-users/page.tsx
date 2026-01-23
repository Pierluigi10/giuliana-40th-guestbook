import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserApprovalQueue } from '@/components/admin/UserApprovalQueue'

export const metadata: Metadata = {
  title: 'Approva Utenti',
  description: 'Pannello admin - Gestisci le richieste di registrazione degli ospiti',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Approva Utenti - Admin',
    description: 'Pannello amministrativo',
    type: 'website',
  },
}

export default async function ApproveUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (profile?.role !== 'admin') {
    redirect('/login')
  }

  // Fetch pending guests
  const { data: pendingGuests } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('role', 'guest')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Approva Utenti</h1>
          <p className="text-muted-foreground">
            Gestisci le richieste di registrazione degli ospiti
          </p>
        </div>

        <UserApprovalQueue initialGuests={pendingGuests || []} />
      </div>
    </div>
  )
}
