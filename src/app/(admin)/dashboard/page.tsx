import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminStats } from '@/components/admin/AdminStats'
import { StorageMonitor } from '@/components/admin/StorageMonitor'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Dashboard Admin',
  description: 'Pannello amministrativo - Statistiche e monitoraggio',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Dashboard Admin',
    description: 'Pannello amministrativo',
    type: 'website',
  },
}

export default async function AdminDashboardPage() {
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
          <h1 className="text-4xl font-bold mb-2">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Panoramica completa dello stato dell&apos;applicazione
          </p>
        </div>

        {/* Storage Monitor */}
        <div className="mb-6">
          <StorageMonitor />
        </div>

        {/* Admin Statistics */}
        <AdminStats />
      </div>
    </div>
  )
}
