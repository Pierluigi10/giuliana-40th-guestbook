/**
 * Confetti helper that safely imports canvas-confetti only in the browser
 * This prevents build errors when canvas-confetti tries to access DOM/Canvas APIs
 */

export async function triggerConfetti(options?: Parameters<typeof import('canvas-confetti').default>[0]) {
  if (typeof window === 'undefined') {
    return // Server-side: do nothing
  }

  try {
    const confetti = (await import('canvas-confetti')).default
    confetti(options)
  } catch (error) {
    // Silently fail if confetti can't be loaded
    console.warn('Failed to load confetti:', error)
  }
}

export async function triggerConfettiBurst(colors: string[] = ['#FF69B4', '#9D4EDD', '#FFD700']) {
  await triggerConfetti({
    particleCount: 50,
    spread: 60,
    origin: { x: 0.5, y: 0.5 },
    colors,
  })
}
