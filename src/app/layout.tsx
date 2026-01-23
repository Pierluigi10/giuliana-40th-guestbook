import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { TopLoadingBar } from '@/components/loading/TopLoadingBar'
import './globals.css'
import './nprogress-styles.css'

const inter = Inter({ subsets: ['latin'] })

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tanti-auguri-giuliana.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    template: 'Guestbook Giuliana 40 | %s',
    default: 'Guestbook Giuliana 40 - Auguri per i tuoi 40 Anni',
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
    siteName: 'Guestbook Giuliana 40',
    title: 'Guestbook Giuliana 40 - Auguri per i tuoi 40 Anni',
    description: 'Guestbook privato per il 40esimo compleanno di Giuliana. Condividi messaggi, foto e video.',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Guestbook Giuliana 40',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guestbook Giuliana 40 - Auguri per i tuoi 40 Anni',
    description: 'Condividi i tuoi auguri per il compleanno di Giuliana',
    images: [`${baseUrl}/og-image.png`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Guestbook Giuliana 40',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className={inter.className} suppressHydrationWarning>
        <TopLoadingBar />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
