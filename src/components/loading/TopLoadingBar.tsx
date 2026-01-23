'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  speed: 400,
  minimum: 0.25,
  trickleSpeed: 200,
})

function TopLoadingBarComponent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Start loading when route changes
    NProgress.start()

    // Complete loading after a small delay (simulating page load)
    const timeout = setTimeout(() => {
      NProgress.done()
    }, 100)

    return () => {
      clearTimeout(timeout)
      NProgress.done()
    }
  }, [pathname, searchParams])

  return null
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarComponent />
    </Suspense>
  )
}
