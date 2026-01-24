import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Accedi al guestbook di Giuliana per condividere i tuoi auguri',
  openGraph: {
    title: 'Accedi - Guestbook Giuliana 40',
    description: 'Accedi per partecipare alla celebrazione',
    type: 'website',
  },
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center mb-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
            Accedi
          </h1>
          <p className="mt-2 text-muted-foreground">
            Benvenuto al guestbook di Giuliana
          </p>
        </div>

        <Suspense fallback={<div>Caricamento...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground">
          Non hai un account?{' '}
          <Link href="/register" className="font-medium text-birthday-purple hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  )
}
