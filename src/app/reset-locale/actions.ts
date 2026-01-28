'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type Locale } from '@/i18n/config'

export async function setLocaleAction(locale: Locale, currentPath: string) {
  const cookieStore = await cookies()

  // Set the locale cookie with 1-year expiration
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  })

  // Redirect to the current path to trigger a server re-render
  redirect(currentPath)
}
