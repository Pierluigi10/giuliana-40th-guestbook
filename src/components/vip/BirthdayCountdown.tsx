'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

// Birthday date: February 4, 2026
const BIRTHDAY_DATE = new Date('2026-02-04T00:00:00')

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(): TimeLeft | null {
  const now = new Date()
  const difference = BIRTHDAY_DATE.getTime() - now.getTime()

  if (difference <= 0) {
    return null // Birthday has passed or is today
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export function BirthdayCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft())
  const [hasCelebrated, setHasCelebrated] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      // Celebrate when it's the birthday!
      if (!newTimeLeft && !hasCelebrated) {
        setHasCelebrated(true)
        // Big confetti celebration!
        const colors = ['#FF69B4', '#9D4EDD', '#FFD700', '#FF6B9D', '#C44569']
        
        // Multiple bursts
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { x: Math.random(), y: Math.random() },
              colors,
            })
          }, i * 200)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [hasCelebrated])

  if (!timeLeft) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold rounded-lg shadow-lg p-4 md:p-6 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="text-4xl md:text-6xl mb-3 md:mb-4"
        >
          🎉
        </motion.div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          È il tuo compleanno!
        </h3>
        <p className="text-base md:text-lg text-white/90">
          Buon 40° compleanno Giuliana! 🎂✨
        </p>
      </motion.div>
    )
  }

  const timeUnits = [
    { label: 'Giorni', value: timeLeft.days, emoji: '📅' },
    { label: 'Ore', value: timeLeft.hours, emoji: '⏰' },
    { label: 'Minuti', value: timeLeft.minutes, emoji: '⏱️' },
    { label: 'Secondi', value: timeLeft.seconds, emoji: '⏲️' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-birthday-pink/20 via-birthday-purple/20 to-birthday-gold/20 rounded-lg shadow-lg p-4 md:p-6 border border-birthday-purple/30"
    >
      <div className="text-center mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">
          ⏳ Countdown al Compleanno
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground">
          Mancano ancora...
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 rounded-lg p-3 md:p-4 text-center shadow-md"
          >
            <div className="text-2xl md:text-3xl mb-1 md:mb-2">{unit.emoji}</div>
            <motion.div
              key={unit.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-birthday-pink to-birthday-purple bg-clip-text text-transparent mb-1"
            >
              {unit.value}
            </motion.div>
            <div className="text-xs font-medium text-gray-600">{unit.label}</div>
          </motion.div>
        ))}
      </div>

      {timeLeft.days === 0 && timeLeft.hours < 24 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <p className="text-sm font-semibold text-birthday-purple">
            🎊 Quasi ci siamo! Il grande giorno sta arrivando! 🎊
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
