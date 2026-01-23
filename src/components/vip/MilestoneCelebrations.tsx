'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { VIPStats } from '@/lib/supabase/queries'

interface MilestoneCelebrationsProps {
  stats: VIPStats | null
  previousStats: VIPStats | null
}

const milestones = [
  { type: 'friends' as const, threshold: 10, message: '🎉 10 amici hanno partecipato!', emoji: '👥' },
  { type: 'friends' as const, threshold: 20, message: '🎊 20 amici fantastici!', emoji: '🌟' },
  { type: 'friends' as const, threshold: 30, message: '✨ 30 amici meravigliosi!', emoji: '💫' },
  { type: 'content' as const, threshold: 25, message: '📦 25 contenuti speciali!', emoji: '🎁' },
  { type: 'content' as const, threshold: 50, message: '🎈 50 contenuti incredibili!', emoji: '🎉' },
  { type: 'content' as const, threshold: 100, message: '🏆 100 contenuti! Sei amata!', emoji: '💖' },
  { type: 'reactions' as const, threshold: 50, message: '❤️ 50 reazioni di amore!', emoji: '💕' },
  { type: 'reactions' as const, threshold: 100, message: '🔥 100 reazioni! Incredibile!', emoji: '✨' },
]

export function MilestoneCelebrations({ stats, previousStats }: MilestoneCelebrationsProps) {
  const celebratedMilestones = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!stats || !previousStats) return

    const colors = ['#FF69B4', '#9D4EDD', '#FFD700', '#FF6B9D', '#C44569']

    milestones.forEach((milestone) => {
      const currentValue =
        milestone.type === 'friends'
          ? stats.totalFriends
          : milestone.type === 'content'
          ? stats.totalContent
          : stats.totalReactions

      const previousValue =
        milestone.type === 'friends'
          ? previousStats.totalFriends
          : milestone.type === 'content'
          ? previousStats.totalContent
          : previousStats.totalReactions

      const milestoneKey = `${milestone.type}-${milestone.threshold}`
      const justReached = currentValue >= milestone.threshold && previousValue < milestone.threshold

      if (justReached && !celebratedMilestones.current.has(milestoneKey)) {
        celebratedMilestones.current.add(milestoneKey)

        // Trigger confetti celebration
        setTimeout(() => {
          // Center burst
          confetti({
            particleCount: 150,
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
              startVelocity: 30,
            })
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors,
              startVelocity: 30,
            })
          }, 200)
        }, 500)

        // Show toast notification (if available)
        if (typeof window !== 'undefined' && (window as any).toast) {
          ;(window as any).toast.success(milestone.message, {
            duration: 5000,
            icon: milestone.emoji,
          })
        }
      }
    })
  }, [stats, previousStats])

  return null // This component only triggers side effects
}
