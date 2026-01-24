'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Menu, LayoutDashboard, CheckCircle, Users, Shield, Download } from 'lucide-react'
import confetti from 'canvas-confetti'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

  const handleLogoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Festive confetti colors matching the theme
    const colors = ['#FF69B4', '#9D4EDD', '#FFD700', '#FF6B9D', '#C44569']
    
    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors,
    })
    
    // Side bursts for extra celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        startVelocity: 30,
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        startVelocity: 30,
      })
    }, 200)
  }

  return (
    <header
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      role="banner"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo - Left */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
          aria-label="Spara coriandoli festosi"
        >
          <h2 className="text-xl font-semibold bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent">
            Guestbook Giuliana
          </h2>
        </button>

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
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium hover:text-birthday-gold transition-colors flex items-center gap-1">
                  Admin
                  <Menu className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Pannello Admin</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/approve-content" className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle className="h-4 w-4" />
                      Modera Contenuti
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/manage-users" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Gestione Utenti
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/security-log" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      Log di Sicurezza
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/export" className="flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" />
                      Esporta Dati
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            className="inline-flex items-center gap-2 rounded-md px-3 md:px-4 py-2 min-h-[44px] text-sm md:text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
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
                    <>
                      <div className="border-t pt-4 mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          Area Admin
                        </p>
                        <div className="flex flex-col gap-3">
                          <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-base font-medium hover:text-birthday-purple transition-colors py-2"
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                          </Link>
                          <Link
                            href="/approve-content"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-base font-medium hover:text-birthday-purple transition-colors py-2"
                          >
                            <CheckCircle className="h-5 w-5" />
                            Modera Contenuti
                          </Link>
                          <Link
                            href="/manage-users"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-base font-medium hover:text-birthday-purple transition-colors py-2"
                          >
                            <Users className="h-5 w-5" />
                            Gestione Utenti
                          </Link>
                          <Link
                            href="/security-log"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-base font-medium hover:text-birthday-purple transition-colors py-2"
                          >
                            <Shield className="h-5 w-5" />
                            Log di Sicurezza
                          </Link>
                          <Link
                            href="/export"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-base font-medium hover:text-birthday-purple transition-colors py-2"
                          >
                            <Download className="h-5 w-5" />
                            Esporta Dati
                          </Link>
                        </div>
                      </div>
                    </>
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
