import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login')

  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: `${t('title')} - Guestbook Giuliana 40`,
      description: t('subtitle'),
      type: 'website',
    },
  }
}

export default async function LoginPage() {
  const t = await getTranslations('auth.login')
  const tc = await getTranslations('common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center mb-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {tc('home')}
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <Suspense fallback={<div>{tc('loading')}</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-birthday-purple hover:underline">
            {tc('register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
