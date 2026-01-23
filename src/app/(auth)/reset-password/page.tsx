import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reimposta Password',
  description: 'Imposta una nuova password per il tuo account',
  openGraph: {
    title: 'Reimposta Password - Guestbook Giuliana 40',
    description: 'Imposta una nuova password',
    type: 'website',
  },
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
            Reimposta Password
          </h1>
          <p className="mt-2 text-muted-foreground">
            Crea una nuova password sicura
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  )
}
