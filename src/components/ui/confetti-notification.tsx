'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

interface ConfettiNotificationProps {
  trigger: boolean
  message?: string
  type?: 'new-content' | 'approval' | 'celebration'
}

/**
 * Component that triggers confetti animation with toast notification
 * Use this when new content is approved or added to the gallery
 */
export function ConfettiNotification({ trigger, message, type = 'new-content' }: ConfettiNotificationProps) {
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (!trigger || hasTriggered.current) return

    hasTriggered.current = true

    // Show toast notification
    const toastMessage = message || getDefaultMessage(type)
    toast.success(toastMessage, {
      duration: 4000,
      icon: '🎉',
    })

    // Trigger confetti animation
    const duration = 2000
    const end = Date.now() + duration
    const colors = ['#FF69B4', '#9D4EDD', '#FFD700', '#FF6B9D', '#C44569']

    const frame = () => {
      // Left side confetti
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        startVelocity: 30,
      })

      // Right side confetti
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        startVelocity: 30,
      })

      // Center burst
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      } else {
        // Final burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.5 },
          colors,
        })
      }
    }

    frame()

    // Reset after animation completes
    setTimeout(() => {
      hasTriggered.current = false
    }, duration + 500)
  }, [trigger, message, type])

  return null
}

function getDefaultMessage(type: ConfettiNotificationProps['type']): string {
  switch (type) {
    case 'new-content':
      return 'Nuovo contenuto aggiunto! 🎉'
    case 'approval':
      return 'Contenuto approvato! ✨'
    case 'celebration':
      return 'Celebriamo insieme! 🎊'
    default:
      return '🎉'
  }
}

/**
 * Hook to trigger confetti programmatically
 */
export function useConfetti() {
  const triggerConfetti = (message?: string, type?: ConfettiNotificationProps['type']) => {
    const colors = ['#FF69B4', '#9D4EDD', '#FFD700', '#FF6B9D', '#C44569']
    
    // Show toast
    toast.success(message || '🎉', {
      duration: 3000,
      icon: '🎉',
    })

    // Confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors,
    })

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
    }, 200)
  }

  return { triggerConfetti }
}
