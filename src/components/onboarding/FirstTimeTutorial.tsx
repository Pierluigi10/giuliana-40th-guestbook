'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface FirstTimeTutorialProps {
  userId: string
  onComplete: () => void
  onTabChange?: (tab: 'text' | 'image' | 'video') => void
}

type TutorialStep = 
  | 'welcome'
  | 'tabs-overview'
  | 'text-tab'
  | 'image-tab'
  | 'video-tab'
  | 'complete'

interface StepConfig {
  title: string
  description: string
  highlightSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const TUTORIAL_STEPS: Record<TutorialStep, StepConfig> = {
  welcome: {
    title: 'Benvenuto! 👋',
    description: 'Ti guideremo passo dopo passo per caricare il tuo messaggio speciale per Giuliana. È facile e veloce!',
    position: 'center',
  },
  'tabs-overview': {
    title: 'Scegli il tipo di contenuto 📝',
    description: 'Puoi caricare un messaggio di testo, una foto o un video. Clicca sulle tab in alto per scegliere!',
    highlightSelector: '[data-tutorial-tabs]',
    position: 'bottom',
  },
  'text-tab': {
    title: 'Messaggio di testo 💬',
    description: 'Scrivi un messaggio speciale per Giuliana (minimo 10 caratteri). Puoi esprimere i tuoi auguri con parole!',
    highlightSelector: '[data-tutorial-text-tab]',
    position: 'bottom',
  },
  'image-tab': {
    title: 'Carica una foto 📸',
    description: 'Trascina una foto qui o clicca per selezionarla. Le immagini grandi verranno compresse automaticamente.',
    highlightSelector: '[data-tutorial-image-tab]',
    position: 'bottom',
  },
  'video-tab': {
    title: 'Carica un video 🎥',
    description: 'Condividi un video speciale! Puoi trascinarlo qui o selezionarlo dal tuo dispositivo (max 10MB).',
    highlightSelector: '[data-tutorial-video-tab]',
    position: 'bottom',
  },
  complete: {
    title: 'Tutto pronto! 🎉',
    description: 'Ora sai come funziona! Carica il tuo contenuto e sarà in attesa di approvazione. Buon divertimento!',
    position: 'center',
  },
}

const STORAGE_KEY = 'g_gift_tutorial_completed'

export function FirstTimeTutorial({ userId, onComplete, onTabChange }: FirstTimeTutorialProps) {
  const [currentStep, setCurrentStep] = useState<TutorialStep>('welcome')
  const [shouldShow, setShouldShow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkIfShouldShowTutorial()
  }, [userId])

  const checkIfShouldShowTutorial = async () => {
    try {
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
    const steps: TutorialStep[] = ['welcome', 'tabs-overview', 'text-tab', 'image-tab', 'video-tab', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1]
      setCurrentStep(nextStep)
      
      // Auto-switch tab when entering tab-specific steps
      if (nextStep === 'text-tab' && onTabChange) {
        onTabChange('text')
      } else if (nextStep === 'image-tab' && onTabChange) {
        onTabChange('image')
      } else if (nextStep === 'video-tab' && onTabChange) {
        onTabChange('video')
      }
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    const steps: TutorialStep[] = ['welcome', 'tabs-overview', 'text-tab', 'image-tab', 'video-tab', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1]
      setCurrentStep(prevStep)
      
      // Auto-switch tab when going back to tab-specific steps
      if (prevStep === 'text-tab' && onTabChange) {
        onTabChange('text')
      } else if (prevStep === 'image-tab' && onTabChange) {
        onTabChange('image')
      } else if (prevStep === 'video-tab' && onTabChange) {
        onTabChange('video')
      } else if (prevStep === 'tabs-overview' && onTabChange) {
        // Keep text tab when going back to overview
        onTabChange('text')
      }
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, 'true')
    setShouldShow(false)
    onComplete()
  }

  // Update highlight position when step changes
  useEffect(() => {
    if (!shouldShow || currentStep === 'welcome' || currentStep === 'complete') {
      return
    }

    const stepConfig = TUTORIAL_STEPS[currentStep]
    if (!stepConfig.highlightSelector) return

    const updateHighlightPosition = (element: Element) => {
      if (!overlayRef.current) return

      const rect = element.getBoundingClientRect()
      const overlay = overlayRef.current

      // Create spotlight effect using CSS custom properties
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const radius = Math.max(rect.width, rect.height) / 2 + 20

      overlay.style.setProperty('--spotlight-x', `${centerX}px`)
      overlay.style.setProperty('--spotlight-y', `${centerY}px`)
      overlay.style.setProperty('--spotlight-radius', `${radius}px`)

      // Position tooltip
      if (tooltipRef.current) {
        const tooltip = tooltipRef.current

        // Force reflow to get accurate dimensions
        tooltip.style.visibility = 'hidden'
        tooltip.style.display = 'block'
        const tooltipRect = tooltip.getBoundingClientRect()
        tooltip.style.visibility = 'visible'

        let top = centerY + radius + 20
        let left = centerX - tooltipRect.width / 2

        // Adjust based on position preference
        if (stepConfig.position === 'top') {
          top = rect.top - tooltipRect.height - 20
        } else if (stepConfig.position === 'left') {
          left = rect.left - tooltipRect.width - 20
          top = centerY - tooltipRect.height / 2
        } else if (stepConfig.position === 'right') {
          left = rect.right + 20
          top = centerY - tooltipRect.height / 2
        }

        // Keep tooltip in viewport
        const padding = 20
        if (left < padding) left = padding
        if (left + tooltipRect.width > window.innerWidth - padding) {
          left = window.innerWidth - tooltipRect.width - padding
        }
        if (top < padding) top = padding
        if (top + tooltipRect.height > window.innerHeight - padding) {
          top = window.innerHeight - tooltipRect.height - padding
        }

        tooltip.style.top = `${top}px`
        tooltip.style.left = `${left}px`
      }
    }

    const updatePosition = () => {
      const element = document.querySelector(stepConfig.highlightSelector!)
      if (element) {
        updateHighlightPosition(element)
      }
    }

    // Wait a bit for tab changes to render, then retry after a longer delay
    let initialTimeout: NodeJS.Timeout | undefined
    let retryTimeout: NodeJS.Timeout | undefined

    initialTimeout = setTimeout(() => {
      updatePosition()

      // Retry after a longer delay if element still not found
      retryTimeout = setTimeout(() => {
        updatePosition()
      }, 200)
    }, 150)

    // Update on window resize and scroll
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      // Clear both timeouts if they exist
      if (initialTimeout) clearTimeout(initialTimeout)
      if (retryTimeout) clearTimeout(retryTimeout)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [currentStep, shouldShow])

  if (isLoading || !shouldShow) {
    return null
  }

  const stepConfig = TUTORIAL_STEPS[currentStep]
  const steps: TutorialStep[] = ['welcome', 'tabs-overview', 'text-tab', 'image-tab', 'video-tab', 'complete']
  const currentIndex = steps.indexOf(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === steps.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black/70"
        />

        {/* Tooltip */}
        {(currentStep === 'welcome' || currentStep === 'complete') ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <motion.div
              ref={tooltipRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 relative"
            >
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-birthday-purple mb-2">
                  {stepConfig.title}
                </h3>
                <p className="text-gray-600">{stepConfig.description}</p>
              </div>

              <div className="flex gap-2 justify-center">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Indietro
                  </button>
                )}
                <button
                  onClick={isLastStep ? handleComplete : handleNext}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-birthday-pink to-birthday-purple rounded-md hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  {isLastStep ? 'Inizia!' : 'Avanti'}
                  {!isLastStep && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 flex gap-1 justify-center">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index <= currentIndex
                        ? 'bg-birthday-purple w-6'
                        : 'bg-gray-200 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="absolute pointer-events-auto" ref={tooltipRef}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl p-6 max-w-sm relative"
            >
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-birthday-purple mb-2">
                  {stepConfig.title}
                </h3>
                <p className="text-gray-600 text-sm">{stepConfig.description}</p>
              </div>

              <div className="flex gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Indietro
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-birthday-pink to-birthday-purple rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  Avanti
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 flex gap-1 justify-center">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index <= currentIndex
                        ? 'bg-birthday-purple w-6'
                        : 'bg-gray-200 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
