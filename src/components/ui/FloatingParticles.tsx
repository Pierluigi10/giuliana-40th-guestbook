'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function FloatingParticles({ count = 20 }: { count?: number }) {
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    // Generate random particles
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    }))
  }, [count])

  const colors = [
    'bg-birthday-pink/30',
    'bg-birthday-purple/30',
    'bg-birthday-gold/30',
    'bg-birthday-sky/30',
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particlesRef.current.map((particle) => {
        const color = colors[particle.id % colors.length]
        return (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${color} blur-sm`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </div>
  )
}
