import { type NextRequest, NextResponse } from 'next/server'
// import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Proxy (formerly middleware)
 * Handles route protection and authentication
 * 
 * Note: In Next.js 16+, middleware.ts was renamed to proxy.ts
 * The function name also changed from `middleware` to `proxy`
 */
export async function proxy(request: NextRequest) {
  // Temporarily disabled for debugging
  return NextResponse.next()
  // return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
