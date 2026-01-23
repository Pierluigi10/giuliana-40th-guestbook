import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth Callback Route Handler
 *
 * Gestisce il callback di conferma email da Supabase.
 * Questa route viene chiamata quando l'utente clicca sul link
 * nell'email di conferma inviata da Supabase.
 *
 * Flow:
 * 1. Utente si registra → Supabase invia email con link di conferma
 * 2. Link punta a: /auth/callback?code=xxx
 * 3. Questa route scambia il code con una sessione autenticata
 * 4. Utente viene reindirizzato alla pagina appropriata (upload/gallery/admin)
 *
 * @see https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || null

  // Se non c'è code, redirect al login
  if (!code) {
    console.warn('Auth callback chiamato senza code parameter')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
  }

  try {
    const supabase = await createClient()

    // Scambia il codice di verifica con una sessione valida
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Errore nello scambio code per session:', exchangeError)

      // Gestisci diversi tipi di errore
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

    // Ottieni l'utente autenticato
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Errore nel recupero utente dopo exchange:', userError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=user_not_found`
      )
    }

    // Ottieni il profilo per determinare il redirect in base al ruolo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null; error: any }

    if (profileError) {
      console.error('Errore nel recupero profilo:', profileError)
      // Fallback: redirect generico
      return NextResponse.redirect(`${requestUrl.origin}/`)
    }

    // Determina il path di redirect in base al ruolo
    let redirectPath = next || '/upload' // Default per guest

    if (profile?.role === 'admin') {
      redirectPath = next || '/approve-content'
    } else if (profile?.role === 'vip') {
      redirectPath = next || '/gallery'
    } else if (profile?.role === 'guest') {
      redirectPath = next || '/upload'
    }

    // Log successo (utile per debugging)
    console.log(`Email confermata con successo per ${user.email}, redirect a ${redirectPath}`)

    // Redirect con successo
    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)

  } catch (error) {
    console.error('Errore inaspettato in auth callback:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=unexpected_error`
    )
  }
}
