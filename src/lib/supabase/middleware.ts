import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Refresh session if it's about to expire (within 5 minutes)
  if (user) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session && session.expires_at) {
      const expiryTime = session.expires_at * 1000 // Convert to milliseconds
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000

      if (expiryTime - now < fiveMinutes) {
        await supabase.auth.refreshSession()
      }
    }
  }

  // Get user profile with role
  // Note: is_approved is kept for backward compatibility but is always true
  // after migration 004 (email confirmation replaces manual approval)
  let profile: { role: string; is_approved: boolean } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single()
    profile = data as { role: string; is_approved: boolean } | null
  }

  const path = request.nextUrl.pathname

  // Public routes - allow access but preserve authentication
  if (
    path === '/login' ||
    path === '/register' ||
    path === '/pending-approval' ||
    path === '/'
  ) {
    // If user is authenticated, add their role to response headers for client-side access
    if (user && profile?.role) {
      supabaseResponse.headers.set('X-User-Role', profile.role)
    }
    return supabaseResponse
  }

  // Require authentication for all other routes
  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Check role-based access
  // Note: Routes use Next.js route groups, so (admin)/approve-content becomes /approve-content

  // Admin-only routes (from (admin) route group)
  const adminRoutes = ['/approve-content', '/approve-users', '/dashboard', '/export', '/manage-users', '/security-log']
  if (adminRoutes.some(route => path.startsWith(route))) {
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Guest routes (from (guest) route group) - accessible by guests and admins
  if (path.startsWith('/upload')) {
    // After migration 004, all guests are auto-approved via email confirmation
    // is_approved is always true for guests who have confirmed their email
    // Allow admin to access guest routes for testing
    if (profile?.role !== 'guest' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Gallery route - accessible by all authenticated users (VIP, admin, guest)
  // No special protection needed - authentication check above is sufficient

  return supabaseResponse
}
