import { getStorageStats } from '@/lib/storage-monitor'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProfileRow } from '@/lib/supabase/types'

export async function GET() {
  try {
    // Verifica che sia admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Pick<ProfileRow, 'role'>>()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ottieni stats
    const stats = await getStorageStats()

    if (!stats) {
      return NextResponse.json({ error: 'Failed to fetch storage stats' }, { status: 500 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Storage stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
