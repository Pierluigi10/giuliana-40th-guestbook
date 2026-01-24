import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Create admin client with service role key for auto-confirming emails
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno 6 caratteri' },
        { status: 400 }
      )
    }

    if (fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Inserisci nome e cognome validi' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Create user with auto-confirmed email
    const { data, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (signUpError) {
      // Handle specific errors
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Questa email è già registrata. Prova ad accedere o recupera la password.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Errore durante la creazione dell\'utente' },
        { status: 500 }
      )
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Si è verificato un errore durante la registrazione' },
      { status: 500 }
    )
  }
}
