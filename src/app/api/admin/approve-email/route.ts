import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyApprovalToken } from '@/lib/approval-token'
import type { Database } from '@/types/database'

// Create admin client with service role key
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

/**
 * Approve content directly from email link
 * GET /api/admin/approve-email?token=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Errore</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FFB6C1, #9D4EDD); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #FF69B4; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Token mancante</h1>
            <p>Link non valido. Per favore, usa il link dall'email di notifica.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // Verify token
  const contentId = verifyApprovalToken(token)
  if (!contentId) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Errore</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FFB6C1, #9D4EDD); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #FF69B4; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Token non valido o scaduto</h1>
            <p>Questo link di approvazione non è più valido. I link scadono dopo 7 giorni.</p>
            <p>Per favore, approva il contenuto manualmente dalla <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/approve-content" style="color: #FF69B4;">dashboard admin</a>.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  try {
    const supabase = createAdminClient()

    // Check if content exists and is not already approved
    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('id, approved_at, type, user_id, profiles(full_name, email)')
      .eq('id', contentId)
      .single() as unknown as {
        data: {
          id: string
          approved_at: string | null
          type: 'text' | 'image' | 'video'
          user_id: string
          profiles: { full_name: string; email: string } | null
        } | null
        error: any
      }

    if (fetchError || !content) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Errore</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FFB6C1, #9D4EDD); }
              .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
              h1 { color: #FF69B4; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❓ Contenuto non trovato</h1>
              <p>Il contenuto che stai cercando di approvare non esiste o è stato eliminato.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }

    // Check if already approved
    if (content.approved_at) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Già approvato</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FFB6C1, #9D4EDD); }
              .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
              h1 { color: #FF69B4; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              a { display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Già approvato</h1>
              <p>Questo contenuto è già stato approvato in precedenza!</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/gallery">Vai alla Gallery</a>
            </div>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }

    // Approve content
    const updateData = {
      approved_at: new Date().toISOString()
    }
    const { error: updateError } = await ((supabase as any)
      .from('content')
      .update(updateData)
      .eq('id', contentId))

    if (updateError) {
      throw updateError
    }

    // Send approval notification to user
    const profile = content.profiles as any
    if (profile?.email) {
      try {
        const { sendApprovalNotification } = await import('@/lib/email')
        await sendApprovalNotification({
          userName: profile.full_name || 'Utente',
          userEmail: profile.email,
          contentType: content.type as any,
        })
      } catch (emailError) {
        console.error('Failed to send approval notification:', emailError)
        // Continue even if email fails
      }
    }

    // Success response
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contenuto Approvato</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FFB6C1, #9D4EDD); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #FF69B4; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
            a { display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
            .confetti { font-size: 48px; animation: bounce 1s infinite; }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="confetti">🎉</div>
            <h1>✅ Contenuto approvato!</h1>
            <p>Il contenuto è stato approvato con successo e sarà ora visibile nella gallery!</p>
            <p>L'utente riceverà una notifica via email.</p>
            <div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/gallery">Vai alla Gallery</a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/approve-content">Dashboard Admin</a>
            </div>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  } catch (error) {
    console.error('Error approving content:', error)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Errore</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FFB6C1, #9D4EDD); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #FF69B4; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Errore durante l'approvazione</h1>
            <p>Si è verificato un errore. Riprova più tardi o approva manualmente dalla dashboard admin.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}
