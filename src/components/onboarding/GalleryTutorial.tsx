'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GalleryTutorialProps {
  userId: string
}

type TutorialStep =
  | 'welcome'
  | 'gallery-overview'
  | 'upload-cta'
  | 'complete'

interface StepConfig {
  title: string
  description: string
  emoji: string
}

const TUTORIAL_STEPS: Record<TutorialStep, StepConfig> = {
  welcome: {
    title: 'Benvenuto! 🎉',
    emoji: '🎉',
    description: 'Questa è la galleria di messaggi, foto e video per il compleanno di Giuliana. Qui puoi vedere tutti i contenuti condivisi dai suoi amici!',
  },
  'gallery-overview': {
    title: 'Esplora i contenuti 📸',
    emoji: '📸',
    description: 'Usa i filtri per visualizzare solo messaggi, foto o video. Puoi anche reagire ai contenuti con emoji per mostrare il tuo apprezzamento!',
  },
  'upload-cta': {
    title: 'Lascia il tuo ricordo ✨',
    emoji: '✨',
    description: 'Non hai ancora caricato nulla! Condividi un messaggio, una foto (max 10MB) o un video (max 20MB). I contenuti saranno visibili dopo l\'approvazione dell\'admin.',
  },
  complete: {
    title: 'Tutto pronto! 🎊',
    emoji: '🎊',
    description: 'Ora puoi esplorare la galleria e interagire con i contenuti. Buon divertimento e grazie per aver partecipato!',
  },
}

const STORAGE_KEY = 'g_gift_gallery_tutorial_completed'

export function GalleryTutorial({ userId }: GalleryTutorialProps) {
  const [currentStep, setCurrentStep] = useState<TutorialStep>('welcome')
  const [shouldShow, setShouldShow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkIfShouldShowTutorial()
  }, [userId])

  const checkIfShouldShowTutorial = async () => {
    try {
      // Check if tutorial should be forced (from registration flow)
      const forceTutorial = sessionStorage.getItem('show_gallery_tutorial')
      if (forceTutorial === 'true') {
        // Clear the flag so it only shows once
        sessionStorage.removeItem('show_gallery_tutorial')
        setShouldShow(true)
        setIsLoading(false)
        return
      }

      // Check localStorage first (fast)
      const tutorialCompleted = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      if (tutorialCompleted === 'true') {
        setIsLoading(false)
        return
      }

      // Check if user has already uploaded content
      const supabase = createClient()
      const { data, error } = await supabase
        .from('content')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error checking user content:', error)
        // On error, show tutorial anyway (better UX)
        setShouldShow(true)
        setIsLoading(false)
        return
      }

      // If user has content, don't show tutorial
      if (data) {
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, 'true')
        setIsLoading(false)
        return
      }

      // New user - show tutorial
      setShouldShow(true)
    } catch (error) {
      console.error('Error in tutorial check:', error)
      // On error, show tutorial anyway
      setShouldShow(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    const steps: TutorialStep[] = ['welcome', 'gallery-overview', 'upload-cta', 'complete']
    const currentIndex = steps.indexOf(currentStep)

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1]
      setCurrentStep(nextStep)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, 'true')
    setShouldShow(false)
  }

  const handleUploadRedirect = () => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, 'true')
    setShouldShow(false)
    router.push('/upload')
  }

  if (isLoading || !shouldShow) {
    return null
  }

  const stepConfig = TUTORIAL_STEPS[currentStep]
  const steps: TutorialStep[] = ['welcome', 'gallery-overview', 'upload-cta', 'complete']
  const currentIndex = steps.indexOf(currentStep)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/70"
          onClick={handleSkip}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        >
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            aria-label="Salta tutorial"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Emoji icon */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {stepConfig.emoji}
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent mb-3">
              {stepConfig.title}
            </h3>
            <p className="text-gray-600 text-base leading-relaxed">
              {stepConfig.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {currentStep === 'upload-cta' ? (
              <button
                onClick={handleUploadRedirect}
                className="w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
              >
                <Upload className="w-5 h-5" />
                Carica contenuto
              </button>
            ) : currentStep === 'complete' ? (
              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold rounded-lg hover:opacity-90 transition-opacity shadow-md"
              >
                Inizia!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold rounded-lg hover:opacity-90 transition-opacity shadow-md"
              >
                Avanti
              </button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="mt-6 flex gap-2 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index <= currentIndex
                    ? 'bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold w-8'
                    : 'bg-gray-200 w-2'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
