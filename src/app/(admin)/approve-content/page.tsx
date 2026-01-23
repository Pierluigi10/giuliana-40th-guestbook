import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentModerationQueue } from '@/components/admin/ContentModerationQueue'

export default async function ApproveContentPage() {
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

  // Fetch pending content with author info
  const { data: pendingContent } = await supabase
    .from('content')
    .select(`
      id,
      type,
      text_content,
      media_url,
      created_at,
      user_id,
      profiles (
        full_name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Approva Contenuti</h1>
          <p className="text-muted-foreground">
            Modera i contenuti caricati dagli ospiti prima che siano visibili a Giuliana
          </p>
        </div>

        <ContentModerationQueue initialContent={pendingContent || []} />
      </div>
    </div>
  )
}
