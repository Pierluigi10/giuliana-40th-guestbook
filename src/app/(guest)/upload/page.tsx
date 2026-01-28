import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { UploadTabs } from '@/components/upload/UploadTabs'
import { UploadErrorBoundary } from '@/components/errors/UploadErrorBoundary'
import { Header } from '@/components/layout/Header'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('upload.metadata')

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
    },
  }
}

export default async function UploadPage() {
  const t = await getTranslations('upload')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is guest or admin (admin can access for testing)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string } | null }

  // Allow admin to access upload page for testing
  if (profile?.role !== 'guest' && profile?.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-pink/10 via-birthday-purple/10 to-birthday-gold/10">
      <Header userName={profile?.full_name} userRole={profile?.role} />

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-birthday-rose-gold via-birthday-blush to-birthday-purple bg-clip-text text-transparent">
            {t('pageTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('pageSubtitle', { name: profile?.full_name || 'amico/a' })}
          </p>
        </div>

        {/* Back to Gallery Link */}
        <div className="mb-6 max-w-3xl mx-auto">
          <Link
            href="/gallery"
            className="inline-flex items-center text-birthday-purple hover:text-birthday-purple/80 transition-colors"
          >
            <span className="mr-2">←</span>
            <span>{t('backToGallery')}</span>
          </Link>
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
