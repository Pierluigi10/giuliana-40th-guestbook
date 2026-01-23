import { createClient } from '@/lib/supabase/server'
import { getVIPStats } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is VIP or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'vip' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get stats
    const { data, error } = await getVIPStats(supabase)

    if (error) {
      console.error('Error fetching VIP stats:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in VIP stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
