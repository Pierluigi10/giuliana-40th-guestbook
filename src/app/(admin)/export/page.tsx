import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ExportContent } from '@/components/admin/ExportContent'

export const metadata: Metadata = {
  title: 'Export Contenuti',
  description: 'Esporta tutti i contenuti approvati per backup e preservazione',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Export Contenuti - Admin',
    description: 'Pannello amministrativo',
    type: 'website',
  },
}

export default async function ExportPage() {
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
          <h1 className="text-4xl font-bold mb-2">Export Contenuti</h1>
          <p className="text-muted-foreground">
            Esporta tutti i contenuti approvati per backup e preservazione
          </p>
        </div>

        <ExportContent />
      </div>
    </div>
  )
}
