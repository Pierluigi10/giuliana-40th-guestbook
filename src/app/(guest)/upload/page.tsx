import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadTabs } from '@/components/upload/UploadTabs'

export default async function UploadPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is approved guest
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; is_approved: boolean; full_name: string } | null }

  if (profile?.role !== 'guest' || !profile?.is_approved) {
    redirect('/pending-approval')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-birthday-pink/10 via-birthday-purple/10 to-birthday-gold/10">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent">
            Carica il tuo messaggio
          </h1>
          <p className="text-muted-foreground">
            Ciao {profile?.full_name}! Condividi un messaggio, foto o video per Giuliana 🎉
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <UploadTabs userId={user.id} />
        </div>
      </div>
    </div>
  )
}
