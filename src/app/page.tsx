import { HeroSection } from '@/components/home/HeroSection'
import { FeatureCards } from '@/components/home/FeatureCards'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { getTranslations } from 'next-intl/server'

export default async function Home() {
  const t = await getTranslations()

  return (
    <main className="min-h-screen">
      {/* Fixed Header with Language Switcher */}
      <header className="fixed top-0 right-0 z-50 p-4">
        <LanguageSwitcher />
      </header>

      <HeroSection />
      <FeatureCards />

      <footer className="py-8 px-4 text-center text-sm text-muted-foreground border-t">
        <p>{t('footer.createdWith')}</p>
        <p className="mt-2">{t('footer.poweredBy')}</p>
      </footer>
    </main>
  )
}
