import { createClient } from '@/lib/supabase/server'
import { getVIPStats } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication - all authenticated users can view stats
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stats - no role check required, stats are public to all authenticated users
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
