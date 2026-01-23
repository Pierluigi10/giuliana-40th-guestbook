import type { TypedSupabaseClient, ContentInsert, ContentUpdate, ReactionInsert, ReactionRow, ProfileRow } from './types'

/**
 * Type-safe query helpers for content operations
 *
 * Note: Supabase TypeScript types have known limitations with generic inference
 * in chain methods. These helpers provide proper typing by declaring explicit
 * return types, bypassing the inference issues.
 */

export async function insertContent(supabase: TypedSupabaseClient, data: ContentInsert) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase.from('content').insert(data)
}

export async function updateContent(supabase: TypedSupabaseClient, contentId: string, data: ContentUpdate) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase.from('content').update(data).eq('id', contentId)
}

export async function insertReaction(supabase: TypedSupabaseClient, data: ReactionInsert) {
  // @ts-expect-error - Supabase generic inference limitation on insert
  const result = supabase.from('reactions').insert(data).select().single()
  // @ts-expect-error - Supabase generic inference limitation on return type
  return result as Promise<{ data: ReactionRow | null; error: any }>
}

export async function selectProfileById(supabase: TypedSupabaseClient, userId: string) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single() as Promise<{ data: Pick<ProfileRow, 'role'> | null; error: any }>
}

export async function selectFullProfileById(supabase: TypedSupabaseClient, userId: string) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single() as Promise<{ data: Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'role'> | null; error: any }>
}

export async function getUserContentCount(supabase: TypedSupabaseClient, userId: string) {
  return supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
}

/**
 * Get VIP statistics dashboard data
 * Returns counts for friends, content types, reactions, and recent participants
 */
export interface VIPStats {
  totalFriends: number
  totalContent: number
  contentByType: {
    text: number
    image: number
    video: number
  }
  totalReactions: number
  recentParticipants: Array<{
    user_id: string
    full_name: string
    last_content_date: string
    content_count: number
  }>
}

export async function getVIPStats(supabase: TypedSupabaseClient): Promise<{ data: VIPStats | null; error: any }> {
  try {
    // Get unique friends who have approved content
    const { data: friendsData, error: friendsError } = await supabase
      .from('content')
      .select('user_id')
      .eq('status', 'approved')
      .not('user_id', 'is', null) as { data: Array<{ user_id: string }> | null; error: any }

    if (friendsError) {
      return { data: null, error: friendsError }
    }

    const uniqueFriends = new Set(friendsData?.map(c => c.user_id) || [])
    const totalFriends = uniqueFriends.size

    // Get content counts by type
    const { data: contentData, error: contentError } = await supabase
      .from('content')
      .select('type')
      .eq('status', 'approved') as { data: Array<{ type: 'text' | 'image' | 'video' }> | null; error: any }

    if (contentError) {
      return { data: null, error: contentError }
    }

    const contentByType = {
      text: contentData?.filter(c => c.type === 'text').length || 0,
      image: contentData?.filter(c => c.type === 'image').length || 0,
      video: contentData?.filter(c => c.type === 'video').length || 0,
    }

    const totalContent = contentData?.length || 0

    // Get total reactions count
    const { count: totalReactions, error: reactionsError } = await supabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })

    if (reactionsError) {
      return { data: null, error: reactionsError }
    }

    // Get recent participants (last 10 unique users with their latest content date)
    const { data: recentContent, error: recentError } = await supabase
      .from('content')
      .select(`
        user_id,
        approved_at,
        profiles (
          full_name
        )
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(100) // Get more to filter unique users

    if (recentError) {
      return { data: null, error: recentError }
    }

    // Group by user_id and get latest content date and count
    const participantsMap = new Map<string, {
      user_id: string
      full_name: string
      last_content_date: string
      content_count: number
    }>()

    recentContent?.forEach((item: any) => {
      const userId = item.user_id
      if (!participantsMap.has(userId)) {
        participantsMap.set(userId, {
          user_id: userId,
          full_name: (item.profiles as any)?.full_name || 'Unknown',
          last_content_date: item.approved_at,
          content_count: 1,
        })
      } else {
        const existing = participantsMap.get(userId)!
        existing.content_count++
        // Keep the most recent date
        if (new Date(item.approved_at) > new Date(existing.last_content_date)) {
          existing.last_content_date = item.approved_at
        }
      }
    })

    const recentParticipants = Array.from(participantsMap.values())
      .sort((a, b) => new Date(b.last_content_date).getTime() - new Date(a.last_content_date).getTime())
      .slice(0, 10)

      return {
      data: {
        totalFriends,
        totalContent,
        contentByType,
        totalReactions: totalReactions || 0,
        recentParticipants,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get paginated approved content for gallery
 * Returns content with author info and reactions, ordered by approved_at DESC
 */
export interface PaginatedContentResult {
  data: Array<{
    id: string
    type: 'text' | 'image' | 'video'
    text_content: string | null
    media_url: string | null
    approved_at: string | null
    created_at: string
    user_id: string
    profiles: {
      full_name: string | null
    } | null
    reactions: Array<{
      id: string
      emoji: string
      user_id: string
      profiles: {
        full_name: string | null
      } | null
    }>
  }>
  hasMore: boolean
  error: any
}

export async function getApprovedContentPaginated(
  supabase: TypedSupabaseClient,
  page: number = 0,
  pageSize: number = 20
): Promise<PaginatedContentResult> {
  try {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error } = await supabase
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
      .range(from, to)

    if (error) {
      return { data: [], hasMore: false, error }
    }

    // Check if there are more items by fetching one more
    const { count } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    const totalItems = count || 0
    const hasMore = (from + (data?.length || 0)) < totalItems

    return {
      data: (data || []) as PaginatedContentResult['data'],
      hasMore,
      error: null,
    }
  } catch (error) {
    return { data: [], hasMore: false, error }
  }
}

/**
 * Get Admin statistics dashboard data
 * Returns counts for users, content by status, content by type over time, and recent activity
 */
export interface AdminStats {
  users: {
    total: number
    approved: number
    pending: number
    byRole: {
      admin: number
      vip: number
      guest: number
    }
  }
  content: {
    total: number
    pending: number
    approved: number
    rejected: number
    byType: {
      text: number
      image: number
      video: number
    }
  }
  recentActivity: Array<{
    id: string
    type: 'upload' | 'approval' | 'rejection'
    content_type: 'text' | 'image' | 'video'
    user_name: string
    user_email: string
    timestamp: string
    content_id?: string
  }>
  contentOverTime: Array<{
    date: string
    approved: number
    pending: number
    rejected: number
  }>
}

export async function getAdminStats(supabase: TypedSupabaseClient): Promise<{ data: AdminStats | null; error: any }> {
  try {
    // Get user statistics
    const { count: totalUsers, error: usersCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersCountError) {
      return { data: null, error: usersCountError }
    }

    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('role, is_approved') as { data: Array<{ role: 'admin' | 'vip' | 'guest'; is_approved: boolean }> | null; error: any }

    if (usersError) {
      return { data: null, error: usersError }
    }

    // After migration 004, all users with confirmed email are auto-approved
    // is_approved is always true for authenticated users
    const approvedUsers = allUsers?.length || 0
    const pendingUsers = 0 // No longer used - email confirmation replaces manual approval

    const usersByRole = {
      admin: allUsers?.filter(u => u.role === 'admin').length || 0,
      vip: allUsers?.filter(u => u.role === 'vip').length || 0,
      guest: allUsers?.filter(u => u.role === 'guest').length || 0,
    }

    // Get content statistics
    const { count: totalContent, error: contentCountError } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true })

    if (contentCountError) {
      return { data: null, error: contentCountError }
    }

    const { data: allContent, error: contentError } = await supabase
      .from('content')
      .select('status, type, created_at, approved_at') as { data: Array<{ status: 'pending' | 'approved' | 'rejected'; type: 'text' | 'image' | 'video'; created_at: string; approved_at: string | null }> | null; error: any }

    if (contentError) {
      return { data: null, error: contentError }
    }

    const pendingContent = allContent?.filter(c => c.status === 'pending').length || 0
    const approvedContent = allContent?.filter(c => c.status === 'approved').length || 0
    const rejectedContent = allContent?.filter(c => c.status === 'rejected').length || 0

    const contentByType = {
      text: allContent?.filter(c => c.type === 'text').length || 0,
      image: allContent?.filter(c => c.type === 'image').length || 0,
      video: allContent?.filter(c => c.type === 'video').length || 0,
    }

    // Get recent activity (last 20 items)
    const { data: recentContent, error: recentError } = await supabase
      .from('content')
      .select(`
        id,
        type,
        status,
        created_at,
        approved_at,
        profiles (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (recentError) {
      return { data: null, error: recentError }
    }

    const recentActivity: AdminStats['recentActivity'] = []

    recentContent?.forEach((item: any) => {
      const profile = item.profiles as { full_name: string; email: string } | null
      
      // Add upload event
      recentActivity.push({
        id: `upload-${item.id}`,
        type: 'upload',
        content_type: item.type,
        user_name: profile?.full_name || 'Unknown',
        user_email: profile?.email || '',
        timestamp: item.created_at,
        content_id: item.id,
      })

      // Add approval/rejection event if applicable
      if (item.status === 'approved' && item.approved_at) {
        recentActivity.push({
          id: `approval-${item.id}`,
          type: 'approval',
          content_type: item.type,
          user_name: profile?.full_name || 'Unknown',
          user_email: profile?.email || '',
          timestamp: item.approved_at,
          content_id: item.id,
        })
      } else if (item.status === 'rejected') {
        // For rejected, we use created_at as timestamp since we don't track rejection_at
        recentActivity.push({
          id: `rejection-${item.id}`,
          type: 'rejection',
          content_type: item.type,
          user_name: profile?.full_name || 'Unknown',
          user_email: profile?.email || '',
          timestamp: item.created_at,
          content_id: item.id,
        })
      }
    })

    // Sort by timestamp descending
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    // Keep only last 15 most recent activities
    const topRecentActivity = recentActivity.slice(0, 15)

    // Get content over time (last 30 days)
    const contentOverTime: AdminStats['contentOverTime'] = []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Group content by date
    const contentByDate = new Map<string, { approved: number; pending: number; rejected: number }>()

    allContent?.forEach((item) => {
      const itemDate = new Date(item.created_at)
      if (itemDate >= thirtyDaysAgo) {
        const dateKey = itemDate.toISOString().split('T')[0] // YYYY-MM-DD
        if (!contentByDate.has(dateKey)) {
          contentByDate.set(dateKey, { approved: 0, pending: 0, rejected: 0 })
        }
        const stats = contentByDate.get(dateKey)!
        if (item.status === 'approved') stats.approved++
        else if (item.status === 'pending') stats.pending++
        else if (item.status === 'rejected') stats.rejected++
      }
    })

    // Convert to array and sort by date
    contentByDate.forEach((stats, date) => {
      contentOverTime.push({ date, ...stats })
    })
    contentOverTime.sort((a, b) => a.date.localeCompare(b.date))

    return {
      data: {
        users: {
          total: totalUsers || 0,
          approved: approvedUsers,
          pending: pendingUsers,
          byRole: usersByRole,
        },
        content: {
          total: totalContent || 0,
          pending: pendingContent,
          approved: approvedContent,
          rejected: rejectedContent,
          byType: contentByType,
        },
        recentActivity: topRecentActivity,
        contentOverTime,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}
