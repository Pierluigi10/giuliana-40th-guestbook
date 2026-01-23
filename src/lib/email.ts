import { Resend } from 'resend'

// Initialize Resend only if API key is present
const RESEND_API_KEY = process.env.RESEND_API_KEY
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'

export type ContentType = 'text' | 'image' | 'video'

export interface ContentNotificationParams {
  userName: string
  userEmail: string
  contentType: ContentType
  contentPreview?: string
}

/**
 * Sends email notification to admin when new content is uploaded
 * Non-blocking - upload succeeds even if email fails
 */
export async function sendContentNotification({
  userName,
  userEmail,
  contentType,
  contentPreview,
}: ContentNotificationParams) {
  try {
    // Skip email sending if Resend is not configured
    if (!resend || !RESEND_API_KEY) {
      console.warn('Email notification skipped: RESEND_API_KEY not configured')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    const typeLabel = contentType === 'text' ? 'messaggio' : contentType === 'image' ? 'foto' : 'video'
    const typeEmoji = contentType === 'text' ? '💬' : contentType === 'image' ? '📷' : '🎥'

    const data = await resend.emails.send({
      from: 'Guestbook Giuliana <onboarding@resend.dev>', // Default sender, update with custom domain
      to: [ADMIN_EMAIL],
      subject: `${typeEmoji} Nuovo ${typeLabel} da approvare - ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF69B4;">🎉 Nuovo contenuto da approvare</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Utente:</strong> ${userName} (${userEmail})</p>
            <p><strong>Tipo:</strong> ${typeLabel.toUpperCase()}</p>
            ${contentPreview ? `<p><strong>Anteprima:</strong> ${contentPreview.substring(0, 100)}${contentPreview.length > 100 ? '...' : ''}</p>` : ''}
            <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT', {
              dateStyle: 'short',
              timeStyle: 'short'
            })}</p>
          </div>

          <a href="${APP_URL}/admin/approve-content"
             style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Vai alla Dashboard Admin
          </a>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Questa è una notifica automatica dal Guestbook di Giuliana 40°
          </p>
        </div>
      `,
    })

    console.log('Email notification sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email notification:', error)
    // Non lanciare errore - l'upload deve completare anche se email fallisce
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error'
    return { success: false, error: errorMessage }
  }
}

export interface ApprovalNotificationParams {
  userName: string
  userEmail: string
  contentType: ContentType
  contentPreview?: string
}

/**
 * Sends email notification to user when their content is approved
 * Non-blocking - approval succeeds even if email fails
 */
export async function sendApprovalNotification({
  userName,
  userEmail,
  contentType,
  contentPreview,
}: ApprovalNotificationParams) {
  try {
    // Skip email sending if Resend is not configured
    if (!resend || !RESEND_API_KEY) {
      console.warn('Approval email notification skipped: RESEND_API_KEY not configured')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    const typeLabel = contentType === 'text' ? 'messaggio' : contentType === 'image' ? 'foto' : 'video'
    const typeEmoji = contentType === 'text' ? '💬' : contentType === 'image' ? '📷' : '🎥'

    const data = await resend.emails.send({
      from: 'Guestbook Giuliana <onboarding@resend.dev>', // Default sender, update with custom domain
      to: [userEmail],
      subject: `🎉 Il tuo ${typeLabel} per Giuliana è stato approvato!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF69B4;">🎉 Il tuo contenuto è stato approvato!</h2>

          <p>Ciao ${userName},</p>

          <p>Abbiamo una bella notizia per te! Il tuo ${typeLabel} per il 40° compleanno di Giuliana è stato approvato e ora è visibile nella sua gallery speciale.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tipo contenuto:</strong> ${typeEmoji} ${typeLabel.toUpperCase()}</p>
            ${contentPreview ? `<p><strong>Anteprima:</strong> ${contentPreview.substring(0, 150)}${contentPreview.length > 150 ? '...' : ''}</p>` : ''}
            <p><strong>Data approvazione:</strong> ${new Date().toLocaleString('it-IT', {
              dateStyle: 'short',
              timeStyle: 'short'
            })}</p>
          </div>

          <p>Giuliana potrà vedere il tuo messaggio nella sua gallery VIP e potrà reagire con emoji! 💕</p>

          <a href="${APP_URL}/gallery"
             style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Vedi la Gallery
          </a>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Questa è una notifica automatica dal Guestbook di Giuliana 40°<br>
            Se non hai caricato questo contenuto, ignora questa email.
          </p>
        </div>
      `,
    })

    console.log('Approval email notification sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send approval email notification:', error)
    // Non lanciare errore - l'approvazione deve completare anche se email fallisce
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error'
    return { success: false, error: errorMessage }
  }
}
