'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { isMobileDevice } from '@/lib/mobile-utils'

interface Balloon {
  id: number
  x: number
  y: number
  color: string
  delay: number
  duration: number
  xOscillation: number[]
}

interface Gift {
  id: number
  x: number
  y: number
  color: string
  delay: number
  duration: number
  rotation: number
}

interface BirthdayDecorationsProps {
  variant?: 'gallery' | 'hero'
  showBalloons?: boolean
  showCake?: boolean
  showGifts?: boolean
}

// Theme colors matching tailwind.config.ts
const THEME_COLORS = {
  pink: '#FF69B4', // birthday-pink
  purple: '#9D4EDD', // birthday-purple
  gold: '#FFD700', // birthday-gold
  sky: '#87CEEB', // birthday-sky
}

export function BirthdayDecorations({
  variant = 'gallery',
  showBalloons = true,
  showCake = true,
  showGifts = true,
}: BirthdayDecorationsProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  // Detect mobile on client side and handle resize
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(isMobileDevice())
    }

    // Initial detection
    updateMobileState()

    // Debounce resize handler for better performance
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateMobileState, 150)
    }

    // Listen for resize events (handles device rotation, window resize)
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  const isHero = variant === 'hero'
  // Reduce decorations on mobile for better performance
  const balloonCount = isMobile
    ? isHero
      ? 4 // Reduced from 12
      : 3 // Reduced from 8
    : isHero
      ? 12
      : 8
  const giftCount = isMobile
    ? isHero
      ? 2 // Reduced from 6
      : 2 // Reduced from 4
    : isHero
      ? 6
      : 4

  useEffect(() => {
    // Generate random balloons with oscillation values
    if (showBalloons) {
      const newBalloons = Array.from({ length: balloonCount }, (_, i) => {
        // Oscillation pattern as specified: [0, 10, -10, 0]
        // Each balloon can have slight variation in amplitude for natural look
        const amplitudeVariation = 0.8 + Math.random() * 0.4 // 0.8-1.2 multiplier
        const oscillation = [
          0,
          10 * amplitudeVariation,
          -10 * amplitudeVariation,
          0,
        ]
        return {
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 30 + 70, // Start from bottom 70-100%
          color: Object.values(THEME_COLORS)[i % 4],
          delay: Math.random() * 5,
          duration: Math.random() * 10 + 15, // 15-25 seconds
          xOscillation: oscillation,
        }
      })
      setBalloons(newBalloons)
    }

    // Generate random gifts
    if (showGifts) {
      const newGifts = Array.from({ length: giftCount }, (_, i) => ({
        id: i,
        x: i % 2 === 0 ? Math.random() * 15 : 85 + Math.random() * 15, // Left or right side
        y: Math.random() * 60 + 20, // 20-80% from top
        color: Object.values(THEME_COLORS)[i % 4],
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 4, // 4-6 seconds
        rotation: Math.random() * 10 - 5, // Random rotation between -5 and 5 degrees
      }))
      setGifts(newGifts)
    }
  }, [balloonCount, giftCount, showBalloons, showGifts, isMobile])

  // Hide decorations on very small screens (< 640px) or if user prefers reduced motion
  if (shouldReduceMotion) {
    return null
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10 hidden sm:block"
      aria-hidden="true"
    >
      {/* Balloons */}
      {showBalloons &&
        balloons.map((balloon) => (
          <motion.div
            key={`balloon-${balloon.id}`}
            className="absolute will-change-transform"
            style={{
              left: `${balloon.x}%`,
              top: `${balloon.y}%`,
            }}
            initial={{ y: 0, x: 0 }}
            animate={{
              // Vertical movement: floating upward
              y: [0, -33, -66, -100],
              // Horizontal oscillation: [0, 10, -10, 0] pattern
              x: balloon.xOscillation,
            }}
            transition={{
              duration: balloon.duration,
              delay: balloon.delay,
              repeat: Infinity,
              ease: 'easeInOut',
              // Synchronize keyframes: y and x have 4 keyframes each
              times: [0, 0.33, 0.66, 1],
            }}
          >
            <svg
              width={isMobile ? (isHero ? 40 : 30) : isHero ? 60 : 40}
              height={isMobile ? (isHero ? 55 : 40) : isHero ? 80 : 55}
              viewBox="0 0 40 55"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="select-none"
            >
              {/* Balloon body */}
              <ellipse
                cx="20"
                cy="30"
                rx="18"
                ry="22"
                fill={balloon.color}
                opacity="0.9"
              />
              {/* Balloon highlight */}
              <ellipse
                cx="15"
                cy="25"
                rx="6"
                ry="8"
                fill="white"
                opacity="0.4"
              />
              {/* Balloon string */}
              <line
                x1="20"
                y1="50"
                x2="20"
                y2="55"
                stroke={balloon.color}
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
          </motion.div>
        ))}

      {/* Cake */}
      {showCake && (
        <motion.div
          className="absolute will-change-transform"
          style={{
            left: isHero ? '50%' : '85%',
            top: isHero ? '10%' : '5%',
            transform: 'translateX(-50%)',
          }}
          initial={{ scale: 1, rotate: 0 }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.5, 1],
          }}
        >
          <svg
            width={isMobile ? (isHero ? 50 : 40) : isHero ? 80 : 60}
            height={isMobile ? (isHero ? 50 : 40) : isHero ? 80 : 60}
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="select-none"
          >
            {/* Cake base */}
            <rect
              x="10"
              y="35"
              width="40"
              height="20"
              rx="5"
              fill={THEME_COLORS.pink}
              opacity="0.9"
            />
            {/* Cake middle layer */}
            <rect
              x="12"
              y="25"
              width="36"
              height="12"
              rx="4"
              fill={THEME_COLORS.purple}
              opacity="0.9"
            />
            {/* Cake top layer */}
            <rect
              x="15"
              y="15"
              width="30"
              height="12"
              rx="3"
              fill={THEME_COLORS.gold}
              opacity="0.9"
            />
            {/* Candle */}
            <rect x="28" y="8" width="4" height="8" fill={THEME_COLORS.pink} />
            {/* Flame */}
            <motion.ellipse
              cx="30"
              cy="6"
              rx="2"
              ry="3"
              fill={THEME_COLORS.gold}
              opacity="0.8"
              animate={{
                opacity: [0.8, 1, 0.8],
                ry: [3, 4, 3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Decorative dots */}
            <circle cx="20" cy="30" r="2" fill="white" opacity="0.6" />
            <circle cx="30" cy="30" r="2" fill="white" opacity="0.6" />
            <circle cx="40" cy="30" r="2" fill="white" opacity="0.6" />
          </svg>
        </motion.div>
      )}

      {/* Gifts */}
      {showGifts &&
        gifts.map((gift) => (
          <motion.div
            key={`gift-${gift.id}`}
            className="absolute will-change-transform"
            style={{
              left: `${gift.x}%`,
              top: `${gift.y}%`,
            }}
            initial={{ y: 0, rotate: gift.rotation }}
            animate={{
              // Vertical movement: [0, -20, 0] as specified in plan
              y: [0, -20, 0],
              // Light rotation synchronized with vertical movement
              rotate: [gift.rotation, gift.rotation + 3, gift.rotation - 3, gift.rotation],
            }}
            transition={{
              duration: gift.duration,
              delay: gift.delay,
              repeat: Infinity,
              ease: 'easeInOut',
              // Synchronize keyframes: y and rotate both have 3 keyframes
              times: [0, 0.5, 1],
            }}
          >
            <svg
              width={isMobile ? (isHero ? 35 : 30) : isHero ? 50 : 40}
              height={isMobile ? (isHero ? 35 : 30) : isHero ? 50 : 40}
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="select-none"
            >
              {/* Gift box */}
              <rect
                x="10"
                y="15"
                width="30"
                height="25"
                rx="3"
                fill={gift.color}
                opacity="0.9"
              />
              {/* Ribbon vertical */}
              <rect
                x="23"
                y="15"
                width="4"
                height="25"
                fill="white"
                opacity="0.7"
              />
              {/* Ribbon horizontal */}
              <rect
                x="10"
                y="26"
                width="30"
                height="4"
                fill="white"
                opacity="0.7"
              />
              {/* Bow */}
              <path
                d="M 23 15 Q 20 12 17 15 Q 20 18 23 15"
                fill="white"
                opacity="0.8"
              />
              <path
                d="M 27 15 Q 30 12 33 15 Q 30 18 27 15"
                fill="white"
                opacity="0.8"
              />
              {/* Bow center */}
              <circle cx="25" cy="15" r="3" fill="white" opacity="0.9" />
            </svg>
          </motion.div>
        ))}
    </div>
  )
}
