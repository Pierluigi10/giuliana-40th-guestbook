import { HeroSection } from '@/components/home/HeroSection'
import { FeatureCards } from '@/components/home/FeatureCards'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeatureCards />

      <footer className="py-8 px-4 text-center text-sm text-muted-foreground border-t">
        <p>Creato con ❤️ per il 40° compleanno di Giuliana</p>
        <p className="mt-2">Powered by Next.js, Supabase, and Shadcn/ui</p>
      </footer>
    </main>
  )
}
