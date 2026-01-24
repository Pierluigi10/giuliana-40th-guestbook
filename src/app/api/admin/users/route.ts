import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProfileRow } from '@/lib/supabase/types'

/**
 * GET /api/admin/users
 * Returns list of all users with content count
 * Only accessible by admin role
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify that user is admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Pick<ProfileRow, 'role'>>()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Get all users
    type UserRow = {
      id: string
      email: string
      full_name: string
      role: 'admin' | 'vip' | 'guest'
      is_approved: boolean
      created_at: string
    }

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_approved, created_at')
      .order('created_at', { ascending: false }) as { data: UserRow[] | null; error: any }

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({
        error: 'Errore durante il recupero degli utenti'
      }, { status: 500 })
    }

    // Get content count for each user
    const { data: contentCounts, error: contentError } = await supabase
      .from('content')
      .select('user_id') as { data: Array<{ user_id: string }> | null; error: any }

    if (contentError) {
      console.error('Error fetching content counts:', contentError)
      // Continue without content counts
    }

    // Map content counts to users
    const contentCountMap = new Map<string, number>()
    if (contentCounts) {
      contentCounts.forEach(content => {
        const count = contentCountMap.get(content.user_id) || 0
        contentCountMap.set(content.user_id, count + 1)
      })
    }

    const usersWithCounts = (users || []).map(user => ({
      ...user,
      content_count: contentCountMap.get(user.id) || 0
    }))

    return NextResponse.json(usersWithCounts)
  } catch (error) {
    console.error('Error in get users API:', error)
    return NextResponse.json({
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}
