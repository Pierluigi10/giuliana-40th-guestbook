'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { locales, localeNames, localeEmojis, type Locale } from '@/i18n/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setLocaleAction } from '@/app/reset-locale/actions'

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocaleAction(newLocale, pathname)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="min-h-[44px] touch-manipulation"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
          <span className="sm:hidden">{localeEmojis[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="cursor-pointer"
          >
            <span className="mr-2">{localeEmojis[locale]}</span>
            {localeNames[locale]}
            {locale === currentLocale && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
