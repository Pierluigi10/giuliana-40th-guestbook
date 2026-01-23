import { createClient } from '@/lib/supabase/server'
import { getAdminStats } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'
import type { ProfileRow } from '@/lib/supabase/types'

export async function GET() {
  try {
    // Verify that user is admin
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

    // Get admin stats
    const { data, error } = await getAdminStats(supabase)

    if (error) {
      console.error('Error fetching admin stats:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in admin stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
