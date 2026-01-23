import { sendContentNotification } from '@/lib/email'
import { NextResponse } from 'next/server'

/**
 * Test endpoint for email notifications
 *
 * Usage: GET http://localhost:4000/api/test-email
 *
 * WARNING: This is for testing only. Remove or secure this endpoint before production.
 */
export async function GET() {
  try {
    // Check if email is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'Email notifications not configured',
        error: 'RESEND_API_KEY environment variable is missing. Please add it to .env.local',
        setup_url: 'https://resend.com/signup',
      }, { status: 503 })
    }

    // Test with sample data
    const result = await sendContentNotification({
      userName: 'Mario Rossi',
      userEmail: 'mario.rossi@example.com',
      contentType: 'text',
      contentPreview: 'Buon compleanno Giuliana! Questo è un messaggio di test per verificare che le notifiche email funzionino correttamente. Tanti auguri per i tuoi 40 anni!',
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: result.data,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send email',
        error: result.error,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
