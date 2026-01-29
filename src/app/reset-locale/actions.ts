'use server'

import { cookies } from 'next/headers'
import { type Locale } from '@/i18n/config'

export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies()

  // Set the locale cookie with 1-year expiration
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  })

  // Return success - the client will handle the refresh
  return { success: true }
}
