'use client'

import { motion } from 'framer-motion'
import { LogIn, Upload, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'

const features = [
  {
    icon: LogIn,
    title: 'Accedi',
    description:
      'Registrati con email e conferma per accedere alla piattaforma.',
    gradient: 'from-birthday-pink to-birthday-purple',
    iconColor: 'text-birthday-pink',
  },
  {
    icon: Upload,
    title: 'Carica',
    description:
      'Condividi messaggi, foto e video (max 10MB) per augurare il meglio.',
    gradient: 'from-birthday-purple to-birthday-gold',
    iconColor: 'text-birthday-purple',
  },
  {
    icon: Eye,
    title: 'Visualizza',
    description:
      'Giuliana vedrà tutti i contenuti approvati nella galleria privata.',
    gradient: 'from-birthday-gold to-birthday-pink',
    iconColor: 'text-birthday-gold',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

export function FeatureCards() {
  return (
    <section className="py-12 md:py-24 px-4 sm:px-6 lg:px-8" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-birthday-pink via-birthday-purple to-birthday-gold bg-clip-text text-transparent px-4"
          >
            Come Funziona
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Tre semplici passaggi per contribuire alla celebrazione
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          role="list"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div key={index} variants={itemVariants} role="listitem">
                <Card
                  className="relative h-full p-8 overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
                  style={{
                    background:
                      'linear-gradient(to bottom, hsl(var(--card)), hsl(var(--card)))',
                  }}
                >
                  {/* Gradient border on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                    style={{ padding: '2px' }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div
                    className="absolute inset-[2px] bg-card rounded-[calc(var(--radius)-2px)]"
                    style={{ zIndex: 1 }}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    {/* Icon with gradient background */}
                    <motion.div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      aria-hidden="true"
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>

                    {/* Step number */}
                    <div className="text-sm font-semibold text-muted-foreground">
                      Passo {index + 1}
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-2xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                    >
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
