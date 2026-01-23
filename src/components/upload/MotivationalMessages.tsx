'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const motivationalMessages = [
  {
    text: 'Il tuo messaggio renderà il compleanno di Giuliana ancora più speciale! ✨',
    emoji: '💝',
  },
  {
    text: 'Ogni parola conta - condividi i tuoi ricordi più belli! 🌟',
    emoji: '📝',
  },
  {
    text: 'Giuliana adorerà leggere il tuo messaggio! Continua così! 🎉',
    emoji: '🎁',
  },
  {
    text: 'Stai creando un ricordo indelebile per questo giorno speciale! 💖',
    emoji: '✨',
  },
  {
    text: 'I tuoi amici stanno già partecipando - unisciti a loro! 🎊',
    emoji: '👥',
  },
  {
    text: 'Ogni messaggio è un regalo prezioso per Giuliana! 🎈',
    emoji: '🎂',
  },
  {
    text: 'Stai facendo la differenza con le tue parole! Continua! 🌈',
    emoji: '💌',
  },
]

export function MotivationalMessages() {
  const [currentMessage, setCurrentMessage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length)
    }, 4000) // Change message every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const message = motivationalMessages[currentMessage]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-birthday-pink/10 via-birthday-purple/10 to-birthday-gold/10 rounded-lg p-4 border border-birthday-purple/20"
      >
        <div className="flex items-center gap-3">
          <motion.span
            key={message.emoji}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-2xl"
          >
            {message.emoji}
          </motion.span>
          <p className="text-sm font-medium text-gray-700 flex-1">
            {message.text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
