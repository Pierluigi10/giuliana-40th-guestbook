import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth Callback Route Handler
 *
 * Handles email confirmation callback from Supabase.
 * This route is called when the user clicks the link
 * in the confirmation email sent by Supabase.
 *
 * Flow:
 * 1. User registers → Supabase sends email with confirmation link
 * 2. Link points to: /auth/callback?code=xxx
 * 3. This route exchanges the code for an authenticated session
 * 4. User is redirected to the appropriate page (upload/gallery/admin)
 *
 * @see https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || null

  // If no code, redirect to login
  if (!code) {
    console.warn('Auth callback called without code parameter')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
  }

  try {
    const supabase = await createClient()

    // Exchange verification code for valid session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)

      // Handle different error types
      let errorParam = 'email_confirmation_failed'
      if (exchangeError.message.includes('expired')) {
        errorParam = 'token_expired'
      } else if (exchangeError.message.includes('invalid')) {
        errorParam = 'invalid_token'
      }

      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${errorParam}`
      )
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error retrieving user after exchange:', userError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=user_not_found`
      )
    }

    // Get profile to determine redirect based on role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null; error: any }

    if (profileError) {
      console.error('Error retrieving profile:', profileError)
      // Fallback: generic redirect
      return NextResponse.redirect(`${requestUrl.origin}/`)
    }

    // Determine redirect path based on role
    let redirectPath = next || '/upload' // Default for guest

    if (profile?.role === 'admin') {
      redirectPath = next || '/approve-content'
    } else if (profile?.role === 'vip') {
      redirectPath = next || '/gallery'
    } else if (profile?.role === 'guest') {
      redirectPath = next || '/upload'
    }

    // Log success (useful for debugging)
    console.log(`Email confirmed successfully for ${user.email}, redirecting to ${redirectPath}`)

    // Redirect with success
    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)

  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=unexpected_error`
    )
  }
}
