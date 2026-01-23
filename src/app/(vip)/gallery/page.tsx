import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GalleryView } from '@/components/gallery/GalleryView'
import { ContentErrorBoundary } from '@/components/errors/ContentErrorBoundary'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Galleria VIP',
  description: 'Visualizza tutti i messaggi, foto e video per il compleanno di Giuliana',
  openGraph: {
    title: 'Galleria VIP - Guestbook Giuliana 40',
    description: 'Tutti i messaggi e gli auguri per il compleanno di Giuliana',
    type: 'website',
  },
}

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile - all authenticated users can view gallery
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string } | null }

  if (!profile) {
    redirect('/login')
  }

  // Fetch approved content with author info and reactions
  const { data: approvedContent } = await supabase
    .from('content')
    .select(`
      id,
      type,
      text_content,
      media_url,
      approved_at,
      created_at,
      user_id,
      profiles (
        full_name
      ),
      reactions (
        id,
        emoji,
        user_id,
        profiles (full_name)
      )
    `)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-pink/5 via-birthday-purple/5 to-birthday-gold/5">
      <Header userName={profile?.full_name} userRole={profile?.role} />

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
            🎉 Buon Compleanno Giuliana! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Messaggi, foto e video dai tuoi amici ✨
          </p>
        </div>

        <ContentErrorBoundary>
          <GalleryView
            initialContent={approvedContent || []}
            userId={user.id}
            userRole={profile.role}
          />
        </ContentErrorBoundary>
      </div>
    </div>
  )
}
