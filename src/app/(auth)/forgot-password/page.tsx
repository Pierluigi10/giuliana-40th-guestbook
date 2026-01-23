import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recupera Password',
  description: 'Recupera la tua password per accedere al guestbook di Giuliana',
  openGraph: {
    title: 'Recupera Password - Guestbook Giuliana 40',
    description: 'Recupera la tua password per accedere',
    type: 'website',
  },
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent">
            Recupera Password
          </h1>
          <p className="mt-2 text-muted-foreground">
            Reimpostazione password
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  )
}
