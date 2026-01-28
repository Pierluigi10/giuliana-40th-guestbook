import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

/**
 * Next.js Middleware
 * Handles locale detection, route protection, and authentication
 *
 * This middleware runs on every request and:
 * 1. Detects and sets the user's preferred locale
 * 2. Protects routes based on user roles
 */

// Create i18n middleware (for locale detection only, no route prefixing)
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never', // Don't add /it, /en, /de to URLs
})

export async function middleware(request: NextRequest) {
  // Debug: Log incoming cookie
  const incomingLocale = request.cookies.get('NEXT_LOCALE')
  console.log(`[Middleware] ${request.nextUrl.pathname} - Incoming cookie:`, incomingLocale?.value || 'none')

  // Create a new request with locale header if cookie exists
  let modifiedRequest = request
  if (incomingLocale) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-next-intl-locale', incomingLocale.value)
    modifiedRequest = new NextRequest(request, {
      headers: requestHeaders,
    })
  }

  // 1. Handle locale detection and set cookie
  const intlResponse = intlMiddleware(modifiedRequest)

  // 2. Handle auth and route protection
  const authResponse = await updateSession(modifiedRequest)

  // 3. Start with intl response to preserve locale handling
  const response = NextResponse.next({
    request: {
      headers: intlResponse.headers,
    },
  })

  // Copy ALL cookies from intl response (to preserve NEXT_LOCALE)
  intlResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
    })
  })

  // Copy auth cookies (these take precedence over any duplicate names)
  authResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })

  console.log(`[Middleware] ${request.nextUrl.pathname} - Outgoing cookie:`, response.cookies.get('NEXT_LOCALE')?.value || 'none')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
