'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

interface MotivationalMessage {
  text: string
  emoji: string
}

export function MotivationalMessages() {
  const t = useTranslations('upload.motivational')
  const [currentMessage, setCurrentMessage] = useState(0)

  // Get messages from translations
  const motivationalMessages: MotivationalMessage[] = [
    { text: t('messages.0.text'), emoji: t('messages.0.emoji') },
    { text: t('messages.1.text'), emoji: t('messages.1.emoji') },
    { text: t('messages.2.text'), emoji: t('messages.2.emoji') },
    { text: t('messages.3.text'), emoji: t('messages.3.emoji') },
    { text: t('messages.4.text'), emoji: t('messages.4.emoji') },
    { text: t('messages.5.text'), emoji: t('messages.5.emoji') },
    { text: t('messages.6.text'), emoji: t('messages.6.emoji') },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length)
    }, 4000) // Change message every 4 seconds

    return () => clearInterval(interval)
  }, [motivationalMessages.length])

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
