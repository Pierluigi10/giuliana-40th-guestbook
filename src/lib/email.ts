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
  contentId: string
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
  contentId,
}: ContentNotificationParams) {
  // Debug logging at the start
  console.log('[EMAIL DEBUG] sendContentNotification called:', {
    userName,
    contentType,
    contentId,
    resendConfigured: !!resend,
    apiKeyPresent: !!RESEND_API_KEY,
    adminEmail: ADMIN_EMAIL,
  })

  try {
    // Skip email sending if Resend is not configured
    if (!resend || !RESEND_API_KEY) {
      console.warn('[EMAIL DEBUG] Email notification skipped: RESEND_API_KEY not configured')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    const typeLabel = contentType === 'text' ? 'messaggio' : contentType === 'image' ? 'foto' : 'video'
    const typeEmoji = contentType === 'text' ? '💬' : contentType === 'image' ? '📷' : '🎥'

    // Generate approval token for email-based approval
    const { generateApprovalToken } = await import('./approval-token')
    const approvalToken = generateApprovalToken(contentId)
    const approvalUrl = `${APP_URL}/api/admin/approve-email?token=${approvalToken}`

    console.log('[EMAIL DEBUG] Attempting to send email to:', ADMIN_EMAIL)

    const response = await resend.emails.send({
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

          <div style="margin: 30px 0;">
            <a href="${approvalUrl}"
               style="display: inline-block; background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 0 10px 10px 0; font-weight: bold; font-size: 16px;">
              ✅ Approva Subito
            </a>
            <a href="${APP_URL}/admin/approve-content"
               style="display: inline-block; background: #FF69B4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 0 10px 10px 0;">
              📋 Dashboard Admin
            </a>
          </div>

          <p style="color: #999; font-size: 13px; margin: 20px 0;">
            💡 <strong>Tip:</strong> Clicca "Approva Subito" per approvare il contenuto direttamente da questa email!
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Questa è una notifica automatica dal Guestbook di Giuliana 40°
          </p>
        </div>
      `,
    })

    if (response.error) {
      throw new Error(`Email API error: ${response.error.message}`)
    }

    console.log('[EMAIL DEBUG] Email notification sent successfully:', {
      emailId: response.data?.id,
      to: ADMIN_EMAIL,
      userName,
      contentId,
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error('[EMAIL DEBUG] Failed to send email notification:', error)
    if (error instanceof Error) {
      console.error('[EMAIL DEBUG] Error stack trace:', error.stack)
    }
    // Don't throw error - upload must complete even if email fails
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

export interface SpamAttempt {
  timestamp: number
  ip: string
  email: string
  reason: 'honeypot' | 'rate_limit'
  userAgent?: string
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
  // Debug logging at the start
  console.log('[EMAIL DEBUG] sendApprovalNotification called:', {
    userName,
    userEmail,
    contentType,
    resendConfigured: !!resend,
    apiKeyPresent: !!RESEND_API_KEY,
    adminEmail: ADMIN_EMAIL,
  })

  try {
    // Skip email sending if Resend is not configured
    if (!resend || !RESEND_API_KEY) {
      console.warn('[EMAIL DEBUG] Approval email notification skipped: RESEND_API_KEY not configured')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    const typeLabel = contentType === 'text' ? 'messaggio' : contentType === 'image' ? 'foto' : 'video'
    const typeEmoji = contentType === 'text' ? '💬' : contentType === 'image' ? '📷' : '🎥'

    console.log('[EMAIL DEBUG] Attempting to send approval email to:', userEmail)

    const response = await resend.emails.send({
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

    if (response.error) {
      throw new Error(`Email API error: ${response.error.message}`)
    }

    console.log('[EMAIL DEBUG] Approval email notification sent successfully:', {
      emailId: response.data?.id,
      to: userEmail,
      userName,
      contentType,
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error('[EMAIL DEBUG] Failed to send approval email notification:', error)
    if (error instanceof Error) {
      console.error('[EMAIL DEBUG] Error stack trace:', error.stack)
    }
    // Don't throw error - approval must complete even if email fails
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error'
    return { success: false, error: errorMessage }
  }
}

/**
 * Sends email notification to admin about spam attempts
 * Batched to prevent email spam: sends max 1 email per 10 minutes
 */
export async function sendSpamNotification(attempts: SpamAttempt[]) {
  console.log('[EMAIL DEBUG] sendSpamNotification called with', attempts.length, 'attempts')

  try {
    // Skip email sending if Resend is not configured
    if (!resend || !RESEND_API_KEY) {
      console.warn('[EMAIL DEBUG] Spam notification skipped: RESEND_API_KEY not configured')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    if (attempts.length === 0) {
      return { success: false, error: 'No attempts to report' }
    }

    const honeypotCount = attempts.filter(a => a.reason === 'honeypot').length
    const rateLimitCount = attempts.filter(a => a.reason === 'rate_limit').length

    // Generate HTML table rows for attempts
    const attemptsHtml = attempts.slice(0, 10).map(attempt => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; font-size: 13px;">${new Date(attempt.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</td>
        <td style="padding: 10px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${
            attempt.reason === 'honeypot'
              ? 'background: #FEF3C7; color: #92400E;'
              : 'background: #FEE2E2; color: #991B1B;'
          }">
            ${attempt.reason === 'honeypot' ? '🤖 Bot (honeypot)' : '⚠️ Rate limit'}
          </span>
        </td>
        <td style="padding: 10px; font-family: monospace; font-size: 12px;">${attempt.email}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 12px;">${attempt.ip}</td>
      </tr>
    `).join('')

    const moreAttemptsHtml = attempts.length > 10
      ? `<p style="color: #666; font-size: 13px; margin-top: 10px;">... e altri ${attempts.length - 10} tentativi. Controlla il <a href="${APP_URL}/security-log" style="color: #FF69B4;">Log di Sicurezza</a> per i dettagli completi.</p>`
      : ''

    console.log('[EMAIL DEBUG] Attempting to send spam notification to:', ADMIN_EMAIL)

    const response = await resend.emails.send({
      from: 'Guestbook Giuliana Security <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `🚨 ${attempts.length} tentativo/i di spam bloccato/i`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #DC2626;">🛡️ Allerta Sicurezza</h2>

          <p>Il sistema anti-spam ha bloccato <strong>${attempts.length}</strong> tentativo/i di registrazione sospetto/i:</p>

          <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 5px 0; font-size: 15px;"><strong>🤖 Bot (honeypot):</strong> ${honeypotCount}</p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>⚠️ Rate limit:</strong> ${rateLimitCount}</p>
            <p style="margin: 5px 0; font-size: 13px; color: #666;">
              Ultimo tentativo: ${new Date(attempts[0].timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
            </p>
          </div>

          <h3 style="margin-top: 30px; color: #374151;">Ultimi tentativi bloccati:</h3>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <thead>
              <tr style="background: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
                <th style="padding: 10px; text-align: left; font-weight: 600;">Data/Ora</th>
                <th style="padding: 10px; text-align: left; font-weight: 600;">Motivo</th>
                <th style="padding: 10px; text-align: left; font-weight: 600;">Email</th>
                <th style="padding: 10px; text-align: left; font-weight: 600;">IP</th>
              </tr>
            </thead>
            <tbody>
              ${attemptsHtml}
            </tbody>
          </table>

          ${moreAttemptsHtml}

          <div style="margin: 30px 0;">
            <a href="${APP_URL}/security-log"
               style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              📊 Visualizza Log Completo
            </a>
          </div>

          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #1E40AF;">
              💡 <strong>Nota:</strong> Il sistema di protezione è attivo e funzionante. Non è richiesta alcuna azione da parte tua.
              Questa email è solo informativa per monitorare l'attività sospetta.
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Questa è una notifica automatica di sicurezza dal Guestbook di Giuliana 40°<br>
            Per gestire le notifiche, accedi alla dashboard admin.
          </p>
        </div>
      `,
    })

    if (response.error) {
      throw new Error(`Email API error: ${response.error.message}`)
    }

    console.log('[EMAIL DEBUG] Spam notification sent successfully:', {
      emailId: response.data?.id,
      to: ADMIN_EMAIL,
      attemptsCount: attempts.length,
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error('[EMAIL DEBUG] Failed to send spam notification:', error)
    if (error instanceof Error) {
      console.error('[EMAIL DEBUG] Error stack trace:', error.stack)
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error'
    return { success: false, error: errorMessage }
  }
}
