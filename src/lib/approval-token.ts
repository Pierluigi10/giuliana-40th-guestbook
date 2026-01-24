import { createHmac } from 'crypto'

const SECRET_KEY = process.env.APPROVAL_TOKEN_SECRET || 'default-secret-key-change-in-production'

/**
 * Generate a signed approval token for content
 * Token format: contentId.timestamp.signature
 */
export function generateApprovalToken(contentId: string): string {
  const timestamp = Date.now().toString()
  const payload = `${contentId}.${timestamp}`
  const signature = createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex')

  return `${payload}.${signature}`
}

/**
 * Verify and decode an approval token
 * Returns contentId if valid, null if invalid or expired
 */
export function verifyApprovalToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [contentId, timestamp, signature] = parts

    // Check if timestamp is within 7 days (604800000 ms)
    const now = Date.now()
    const tokenTime = parseInt(timestamp, 10)
    if (now - tokenTime > 604800000) {
      console.warn('Approval token expired')
      return null
    }

    // Verify signature
    const payload = `${contentId}.${timestamp}`
    const expectedSignature = createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.warn('Invalid approval token signature')
      return null
    }

    return contentId
  } catch (error) {
    console.error('Error verifying approval token:', error)
    return null
  }
}
