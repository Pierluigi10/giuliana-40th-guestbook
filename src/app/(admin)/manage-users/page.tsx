import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserManagement } from '@/components/admin/UserManagement'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gestione Utenti - Admin',
  description: 'Gestisci e elimina gli utenti del sistema',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Gestione Utenti - Admin',
    description: 'Gestione utenti',
    type: 'website',
  },
}

export default async function ManageUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string } | null }

  if (profile?.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={profile?.full_name} userRole={profile?.role} />

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-birthday-purple hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Gestione Utenti</h1>
          <p className="text-muted-foreground">
            Visualizza ed elimina gli utenti del sistema
          </p>
        </div>

        {/* Warning Notice */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Attenzione:</strong> L&apos;eliminazione di un utente rimuoverà permanentemente
            tutti i suoi dati, inclusi contenuti caricati e reazioni. Questa azione è irreversibile.
          </p>
        </div>

        {/* User Management Component */}
        <UserManagement />
      </div>
    </div>
  )
}
