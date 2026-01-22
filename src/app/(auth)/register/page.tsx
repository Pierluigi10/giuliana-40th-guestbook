import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
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
