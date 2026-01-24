import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Registrazione',
  description: 'Registrati per partecipare alla celebrazione del 40° di Giuliana',
  openGraph: {
    title: 'Registrazione - Guestbook Giuliana 40',
    description: 'Unisciti agli amici di Giuliana nel guestbook',
    type: 'website',
  },
}

export default function RegisterPage() {
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
            Registrazione
          </h1>
          <p className="mt-2 text-muted-foreground">
            Unisciti alla celebrazione del 40° di Giuliana
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          Hai già un account?{' '}
          <Link href="/login" className="font-medium text-birthday-purple hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
