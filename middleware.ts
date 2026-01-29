import { NextRequest } from 'next/server'
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
  // Get locale from cookie
  const incomingLocale = request.cookies.get('NEXT_LOCALE')

  // Create modified request with locale header if needed
  let modifiedRequest = request
  if (incomingLocale?.value) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-next-intl-locale', incomingLocale.value)
    modifiedRequest = new NextRequest(request, {
      headers: requestHeaders,
    })
  }

  // Handle auth and route protection first (security priority)
  const authResponse = await updateSession(modifiedRequest)

  // If auth requires redirect (e.g., unauthorized access), preserve locale and redirect
  if (authResponse.status === 307 || authResponse.status === 308) {
    // Preserve locale cookie during redirect
    if (incomingLocale?.value) {
      authResponse.cookies.set('NEXT_LOCALE', incomingLocale.value, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      })
    }
    return authResponse
  }

  // Handle locale detection
  const intlResponse = intlMiddleware(modifiedRequest)

  // Copy locale cookie from intl response to auth response
  const localeCookie = intlResponse.cookies.get('NEXT_LOCALE')
  if (localeCookie) {
    authResponse.cookies.set('NEXT_LOCALE', localeCookie.value, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    })
  }

  return authResponse
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
