'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetLocalePage() {
  const router = useRouter()

  useEffect(() => {
    // Delete the locale cookie
    document.cookie = 'NEXT_LOCALE=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    // Wait a moment then redirect to home
    setTimeout(() => {
      router.push('/')
    }, 500)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Resetting language...</h1>
        <p className="text-gray-600">Redirecting to homepage in italiano (default)...</p>
      </div>
    </div>
  )
}
