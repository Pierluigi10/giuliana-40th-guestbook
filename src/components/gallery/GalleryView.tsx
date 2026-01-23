'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ContentCard } from './ContentCard'
import { ContentCardSkeletonGrid } from '@/components/loading/ContentCardSkeleton'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { getApprovedContentPaginated } from '@/lib/supabase/queries'
import type { ContentRow, ReactionRow, ProfileRow } from '@/lib/supabase/types'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useConfetti } from '@/components/ui/confetti-notification'

// Helper component to auto-hide notifications
function NotificationAutoHide({ message, onHide, delay }: { message: string; onHide: () => void; delay: number }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide()
    }, delay)
    return () => clearTimeout(timer)
  }, [message, onHide, delay])
  return null
}

interface Content {
  id: ContentRow['id']
  type: ContentRow['type']
  text_content: ContentRow['text_content']
  media_url: ContentRow['media_url']
  approved_at: ContentRow['approved_at']
  created_at: ContentRow['created_at']
  user_id: ContentRow['user_id']
  profiles: Pick<ProfileRow, 'full_name'> | null
  reactions: Array<Pick<ReactionRow, 'id' | 'emoji' | 'user_id'> & {
    profiles: Pick<ProfileRow, 'full_name'> | null
  }>
}

interface GalleryViewProps {
  initialContent: Content[]
  userId: string
  userRole: string
}

export function GalleryView({ initialContent, userId, userRole }: GalleryViewProps) {
  const [content, setContent] = useState<Content[]>(initialContent)
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video'>('all')
  const [lightboxContent, setLightboxContent] = useState<Content | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Assume there's more if we got exactly 20 items (page size)
  const [hasMore, setHasMore] = useState(initialContent.length === 20)
  const [currentPage, setCurrentPage] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const previousContentIds = useRef<Set<string>>(new Set(initialContent.map(c => c.id)))
  const { triggerConfetti } = useConfetti()
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sound_effects_enabled') !== 'false'
    }
    return true
  })
  const [newContentNotification, setNewContentNotification] = useState<string | null>(null)

  const handleContentDeleted = (contentId: string) => {
    setContent(prev => prev.filter(item => item.id !== contentId))
    if (lightboxContent?.id === contentId) {
      setLightboxContent(null)
    }
  }

  // Load more content when scrolling to bottom
  const loadMoreContent = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const supabase = createClient()
      const nextPage = currentPage + 1
      const result = await getApprovedContentPaginated(supabase, nextPage, 20)

      if (result.error) {
        console.error('Error loading more content:', result.error)
        return
      }

      if (result.data.length > 0) {
        setContent(prev => [...prev, ...result.data])
        setCurrentPage(nextPage)
        setHasMore(result.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more content:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [currentPage, hasMore, isLoadingMore])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreContent()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoadingMore, loadMoreContent])

  // Confetti effect on first load
  useEffect(() => {
    const hasSeenConfetti = localStorage.getItem('confetti_shown')

    if (!hasSeenConfetti) {
      // Trigger confetti
      const duration = 3 * 1000
      const end = Date.now() + duration

      const colors = ['#FF69B4', '#9D4EDD', '#FFD700']

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
      localStorage.setItem('confetti_shown', 'true')
    }
  }, [])

  // Play celebration sound
  const playCelebrationSound = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Create a simple celebration sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Play a cheerful melody
      const frequencies = [523.25, 659.25, 783.99, 1046.50] // C, E, G, C (C major chord)

      const playNote = (freq: number, duration: number, delay: number) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()

          osc.frequency.value = freq
          osc.type = 'sine'
          gain.gain.setValueAtTime(0.1, audioContext.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

          osc.connect(gain)
          gain.connect(audioContext.destination)

          osc.start(audioContext.currentTime)
          osc.stop(audioContext.currentTime + duration)
        }, delay)
      }

      // Play sequence
      frequencies.forEach((freq, index) => {
        playNote(freq, 0.1, index * 100)
      })
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Audio not available:', error)
    }
  }, [])

  // Poll for new content (every 10 seconds if user is VIP/admin)
  useEffect(() => {
    if (userRole !== 'vip' && userRole !== 'admin') return

    const checkForNewContent = async () => {
      try {
        const supabase = createClient()
        const result = await getApprovedContentPaginated(supabase, 0, 20)

        if (result.error || !result.data) return

        const currentIds = new Set(result.data.map(c => c.id))
        const newContent = result.data.filter(c => !previousContentIds.current.has(c.id))

        if (newContent.length > 0) {
          // Update content list (prepend new items)
          setContent(prev => {
            const existingIds = new Set(prev.map(c => c.id))
            const toAdd = newContent.filter(c => !existingIds.has(c.id))
            return [...toAdd, ...prev]
          })

          // Trigger confetti and notification
          const contentType = newContent[0].type === 'text' ? 'messaggio' : 
                             newContent[0].type === 'image' ? 'foto' : 'video'
          const message = newContent.length === 1 
            ? `Nuova ${contentType} aggiunta! 🎉`
            : `${newContent.length} nuovi contenuti aggiunti! 🎉`
          
          triggerConfetti(message, 'new-content')
          setNewContentNotification(message)
          
          // Play sound if enabled
          if (soundEnabled) {
            playCelebrationSound()
          }

          // Update previous content IDs
          previousContentIds.current = currentIds
        }
      } catch (error) {
        console.error('Error checking for new content:', error)
      }
    }

    // Check immediately, then every 10 seconds
    checkForNewContent()
    const interval = setInterval(checkForNewContent, 10000)

    return () => clearInterval(interval)
  }, [userRole, soundEnabled, triggerConfetti, playCelebrationSound])

  // Handle filter change with smooth transition
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter)
  }

  const filteredContent = content.filter((item) => {
    if (filter === 'all') return true
    return item.type === filter
  })

  const filters = [
    { id: 'all' as const, label: 'Tutti', icon: '🎁', count: content.length },
    { id: 'text' as const, label: 'Testo', icon: '📝', count: content.filter(c => c.type === 'text').length },
    { id: 'image' as const, label: 'Foto', icon: '📸', count: content.filter(c => c.type === 'image').length },
    { id: 'video' as const, label: 'Video', icon: '🎥', count: content.filter(c => c.type === 'video').length },
  ]

  if (content.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">🎈</div>
        <h3 className="text-2xl font-bold mb-2">In arrivo...</h3>
        <p className="text-muted-foreground">
          I tuoi amici stanno preparando i loro messaggi!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sound Toggle (only for VIP/Admin) */}
      {(userRole === 'vip' || userRole === 'admin') && (
        <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 flex items-center justify-end">
          <label className="flex items-center gap-2 cursor-pointer touch-manipulation min-h-[44px]">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => {
                setSoundEnabled(e.target.checked)
                localStorage.setItem('sound_effects_enabled', String(e.target.checked))
              }}
              className="w-5 h-5 md:w-4 md:h-4 text-birthday-purple rounded focus:ring-birthday-purple"
            />
            <span className="text-sm md:text-base text-gray-700">🔊 Effetti sonori</span>
          </label>
        </div>
      )}

      {/* New Content Notification */}
      <AnimatePresence>
        {newContentNotification && (
          <motion.div
            key={newContentNotification}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-birthday-pink to-birthday-purple text-white rounded-lg shadow-lg p-4 text-center"
          >
            <p className="text-lg font-semibold">{newContentNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auto-hide notification after 3 seconds */}
      {newContentNotification && (
        <NotificationAutoHide
          message={newContentNotification}
          onHide={() => setNewContentNotification(null)}
          delay={3000}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-3 md:p-4">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {filters.map((f) => (
            <motion.button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`min-h-[44px] px-4 md:px-6 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium transition-all touch-manipulation ${
                filter === f.id
                  ? 'bg-gradient-to-r from-birthday-pink to-birthday-purple text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              <span className="mr-1 md:mr-2 text-base md:text-lg">{f.icon}</span>
              <span className="hidden sm:inline">{f.label}</span>
              <span className="sm:ml-2 opacity-75">({f.count})</span>
            </motion.button>
          ))}
        </div>

        <motion.p
          key={filter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center mt-4 text-sm text-muted-foreground"
        >
          {filteredContent.length === content.length
            ? `${content.length} messaggi totali`
            : `Mostrando ${filteredContent.length} di ${content.length}`}
        </motion.p>
      </div>

      {/* Masonry Grid */}
      {isLoading ? (
        <ContentCardSkeletonGrid count={9} />
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
            >
              {filteredContent.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="break-inside-avoid"
                >
                  <ContentCard
                    content={item}
                    userId={userId}
                    userRole={userRole}
                    onOpenLightbox={() => setLightboxContent(item)}
                    onDelete={handleContentDeleted}
                    animationDelay={index * 0.05}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Infinite scroll trigger and loading indicator */}
          {hasMore && (
            <div ref={observerTarget} className="mt-8 flex justify-center">
              {isLoadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <ContentCardSkeletonGrid count={6} />
                  <p className="text-sm text-muted-foreground">Caricamento altri contenuti...</p>
                </div>
              )}
            </div>
          )}

          {!hasMore && filteredContent.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                🎉 Hai visto tutti i {filteredContent.length} contenuti!
              </p>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxContent && (lightboxContent.type === 'image' || lightboxContent.type === 'video') && (
          <Lightbox
            key={lightboxContent.id}
            content={lightboxContent}
            onClose={() => setLightboxContent(null)}
            onNavigate={(direction: 'next' | 'prev') => {
              const mediaContent = filteredContent.filter(item => item.type === 'image' || item.type === 'video')
              const currentMediaIndex = mediaContent.findIndex(item => item.id === lightboxContent.id)

              if (direction === 'next') {
                const nextIndex = (currentMediaIndex + 1) % mediaContent.length
                setLightboxContent(mediaContent[nextIndex])
              } else {
                const prevIndex = currentMediaIndex === 0 ? mediaContent.length - 1 : currentMediaIndex - 1
                setLightboxContent(mediaContent[prevIndex])
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface LightboxProps {
  content: Content
  onClose: () => void
  onNavigate: (direction: 'next' | 'prev') => void
}

function Lightbox({ content, onClose, onNavigate }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev')
      } else if (e.key === 'ArrowRight') {
        onNavigate('next')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, onNavigate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-2 right-2 md:top-4 md:right-4 text-white bg-black/70 rounded-full p-3 md:p-3 hover:bg-black/80 active:bg-black/90 transition-colors z-10 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Chiudi"
      >
        <svg
          className="w-6 h-6 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </motion.button>

      {/* Previous button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onNavigate('prev')
        }}
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.9 }}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white bg-black/70 rounded-full p-3 md:p-3 hover:bg-black/80 active:bg-black/90 transition-colors z-10 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Precedente"
      >
        <svg
          className="w-6 h-6 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      {/* Next button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onNavigate('next')
        }}
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white bg-black/70 rounded-full p-3 md:p-3 hover:bg-black/80 active:bg-black/90 transition-colors z-10 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Successivo"
      >
        <svg
          className="w-6 h-6 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>

      <motion.div 
        onClick={(e) => e.stopPropagation()} 
        className="max-w-7xl max-h-[95vh] md:max-h-[90vh] w-full px-2 md:px-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content.type === 'image' && content.media_url && (
          <motion.img
            src={content.media_url}
            alt="Full size"
            className="w-full h-auto max-h-[95vh] md:max-h-[90vh] object-contain"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {content.type === 'video' && content.media_url && (
          <motion.video
            src={content.media_url}
            controls
            autoPlay
            playsInline
            className="w-full h-auto max-h-[95vh] md:max-h-[90vh] object-contain"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            Il tuo browser non supporta la riproduzione video.
          </motion.video>
        )}
      </motion.div>
    </motion.div>
  )
}
