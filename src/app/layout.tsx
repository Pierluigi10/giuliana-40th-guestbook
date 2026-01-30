import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { TopLoadingBar } from '@/components/loading/TopLoadingBar'
import { GlobalErrorBoundary } from '@/components/error-boundary'
import './globals.css'
import './nprogress-styles.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tanti-auguri-giuliana.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    template: 'Guestbook dei 40 anni di Giuliana | %s',
    default: 'Guestbook dei 40 anni di Giuliana - Auguri per i tuoi 40 Anni',
  },
  description: 'Guestbook privato per il 40esimo compleanno di Giuliana. Condividi messaggi, foto e video con i tuoi amici.',
  keywords: ['guestbook', 'compleanno', '40 anni', 'Giuliana', 'messaggi', 'festa'],
  authors: [{ name: 'Pierluigi' }],
  creator: 'Pierluigi',
  publisher: 'Giuliana 40 Guestbook',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        rel: 'icon',
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: baseUrl,
    siteName: 'Guestbook dei 40 anni di Giuliana',
    title: 'Guestbook dei 40 anni di Giuliana - Auguri per i tuoi 40 Anni',
    description: 'Guestbook privato per il 40esimo compleanno di Giuliana. Condividi messaggi, foto e video.',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Guestbook dei 40 anni di Giuliana',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guestbook dei 40 anni di Giuliana - Auguri per i tuoi 40 Anni',
    description: 'Condividi i tuoi auguri per il compleanno di Giuliana',
    images: [`${baseUrl}/og-image.png`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Guestbook dei 40 anni di Giuliana',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GlobalErrorBoundary>
            <TopLoadingBar />
            {children}
            <Toaster position="top-center" richColors />
          </GlobalErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
