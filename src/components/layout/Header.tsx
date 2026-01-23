'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

interface HeaderProps {
  userName?: string
  userRole?: string
}

export function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isUploadPage = pathname === '/upload'
  const isGalleryPage = pathname === '/gallery'

  const handleLogout = async () => {
    if (loading) return

    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Errore durante il logout:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      role="banner"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Vai alla homepage del Guestbook Giuliana"
        >
          <h2 className="text-xl font-semibold bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent">
            Guestbook Giuliana
          </h2>
        </Link>

        {/* Mobile Simple Navigation - Only on upload/gallery pages */}
        {userName && (isUploadPage || isGalleryPage) && (
          <nav className="md:hidden flex items-center gap-4">
            {isUploadPage && (
              <Link
                href="/gallery"
                className="text-base font-medium hover:text-birthday-purple transition-colors"
              >
                Galleria
              </Link>
            )}
            {isGalleryPage && (
              <Link
                href="/upload"
                className="text-base font-medium hover:text-birthday-pink transition-colors"
              >
                Lascia un ricordo
              </Link>
            )}
          </nav>
        )}

        {/* Desktop Navigation - Center */}
        {userName && (
          <nav
            className="hidden md:flex items-center gap-6"
            role="navigation"
            aria-label="Menu principale"
          >
            <Link
              href="/gallery"
              className="text-sm font-medium hover:text-birthday-purple transition-colors"
            >
              Galleria
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium hover:text-birthday-pink transition-colors"
            >
              Lascia un ricordo
            </Link>
            {userRole === 'admin' && (
              <Link
                href="/approve-content"
                className="text-sm font-medium hover:text-birthday-gold transition-colors"
              >
                Modera
              </Link>
            )}
          </nav>
        )}

        {/* User Info + Logout - Right */}
        <div className="flex items-center gap-4">
          {/* Hide user icon on mobile when in upload or gallery */}
          {userName && (
            <div
              className={`items-center gap-2 text-sm text-muted-foreground ${
                (isUploadPage || isGalleryPage) ? 'hidden md:flex' : 'flex'
              }`}
              aria-label={`Utente connesso: ${userName}`}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{userName}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Esci dall'applicazione"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Esci</span>
          </button>

          {/* Mobile Menu Button - Hide on upload/gallery pages */}
          {userName && !(isUploadPage || isGalleryPage) && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
                  aria-label="Apri menu di navigazione"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav-menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64" id="mobile-nav-menu">
                <SheetTitle>Menu di Navigazione</SheetTitle>
                <nav
                  className="flex flex-col gap-4 mt-8"
                  role="navigation"
                  aria-label="Menu principale"
                >
                  <Link
                    href="/gallery"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium hover:text-birthday-purple transition-colors py-2"
                  >
                    Galleria
                  </Link>
                  <Link
                    href="/upload"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium hover:text-birthday-pink transition-colors py-2"
                  >
                    Lascia un ricordo
                  </Link>
                  {userRole === 'admin' && (
                    <Link
                      href="/approve-content"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium hover:text-birthday-gold transition-colors py-2"
                    >
                      Modera Contenuti
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
