import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GalleryView } from '@/components/gallery/GalleryView'
import { ContentErrorBoundary } from '@/components/errors/ContentErrorBoundary'
import { Header } from '@/components/layout/Header'
import { StatsDashboard } from '@/components/vip/StatsDashboard'
import { BirthdayCountdown } from '@/components/vip/BirthdayCountdown'
import { FloatingParticles } from '@/components/ui/FloatingParticles'
import { BirthdayDecorations } from '@/components/ui/BirthdayDecorations'
import { GalleryTutorial } from '@/components/onboarding/GalleryTutorial'
import { getVIPStats } from '@/lib/supabase/queries'

export const metadata: Metadata = {
  title: 'Galleria',
  description: 'Visualizza tutti i messaggi, foto e video per il compleanno di Giuliana',
  openGraph: {
    title: 'Galleria - Guestbook Giuliana 40',
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

  // Fetch initial page of approved content (first 20 items for infinite scroll)
  const { getApprovedContentPaginated } = await import('@/lib/supabase/queries')
  const initialContentResult = await getApprovedContentPaginated(supabase, 0, 20)
  const approvedContent = initialContentResult.data || []

  // Fetch VIP statistics
  const { data: vipStats } = await getVIPStats(supabase)

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-pink/5 via-birthday-purple/5 to-birthday-gold/5 relative">
      <FloatingParticles count={25} />
      <BirthdayDecorations variant="gallery" />
      <Header userName={profile?.full_name} userRole={profile?.role} />

      <div className="container mx-auto py-4 md:py-8 px-4">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent px-2">
            🎉 Buon Compleanno Giuliana! 🎉
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-2">
            Messaggi, foto e video dai tuoi amici ✨
          </p>
        </div>

        {/* Birthday Countdown */}
        <ContentErrorBoundary>
          <div className="mb-8">
            <BirthdayCountdown />
          </div>
        </ContentErrorBoundary>

        {/* Guest CTA to Upload */}
        {profile.role === 'guest' && (
          <div className="mb-8 max-w-2xl mx-auto">
            <Link href="/upload">
              <div className="rounded-lg bg-gradient-to-r from-birthday-rose-gold via-birthday-blush to-birthday-purple p-6 text-center cursor-pointer hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Aggiungi il tuo messaggio
                </h2>
                <p className="text-white/90">
                  Condividi un messaggio, foto o video per rendere questo compleanno ancora più speciale
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Statistics Dashboard - only for admin and VIP */}
        {(profile.role === 'admin' || profile.role === 'vip') && (
          <ContentErrorBoundary>
            <div className="mb-8">
              <StatsDashboard initialStats={vipStats} />
            </div>
          </ContentErrorBoundary>
        )}

        {/* Gallery View */}
        <ContentErrorBoundary>
          <GalleryView
            initialContent={approvedContent || []}
            userId={user.id}
            userRole={profile.role}
          />
        </ContentErrorBoundary>

        {/* Gallery Tutorial - only for guests */}
        {profile.role === 'guest' && <GalleryTutorial userId={user.id} />}
      </div>
    </div>
  )
}
