'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ContentCard } from './ContentCard'
import { ContentCardSkeletonGrid } from '@/components/loading/ContentCardSkeleton'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { getApprovedContentPaginated } from '@/lib/supabase/queries'
import type { ContentRow, ReactionRow, ProfileRow } from '@/lib/supabase/types'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useConfetti } from '@/components/ui/confetti-notification'
import Image from 'next/image'
import Masonry from 'react-masonry-css'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

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
  profiles: { full_name: string | null } | null
  reactions: Array<Pick<ReactionRow, 'id' | 'emoji' | 'user_id'> & {
    profiles: { full_name: string | null } | null
  }>
}

interface GalleryViewProps {
  initialContent: Content[]
  userId: string
  userRole: string
}

export function GalleryView({ initialContent, userId, userRole }: GalleryViewProps) {
  const t = useTranslations('gallery')
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
  // Initialize deleted IDs from localStorage to persist across page refreshes
  const getInitialDeletedIds = (): Set<string> => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deleted_content_ids')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  }
  const deletedContentIds = useRef<Set<string>>(getInitialDeletedIds())
  const { triggerConfetti } = useConfetti()
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sound_effects_enabled') !== 'false'
    }
    return true
  })
  const [newContentNotification, setNewContentNotification] = useState<string | null>(null)

  const handleContentDeleted = (contentId: string) => {
    // Track deleted IDs to prevent polling re-adding them
    deletedContentIds.current.add(contentId)

    // Persist to localStorage for cross-refresh persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'deleted_content_ids',
        JSON.stringify(Array.from(deletedContentIds.current))
      )
    }

    setContent(prev => prev.filter(item => item.id !== contentId))

    if (lightboxContent?.id === contentId) {
      setLightboxContent(null)
    }

    // Cleanup deleted IDs after 24 hours instead of 5 minutes
    setTimeout(() => {
      deletedContentIds.current.delete(contentId)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'deleted_content_ids',
          JSON.stringify(Array.from(deletedContentIds.current))
        )
      }
    }, 24 * 60 * 60 * 1000)
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
        toast.error(t('loadingErrorTitle'), {
          description: t('loadingErrorDescription')
        })
        setIsLoadingMore(false)
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
      toast.error(t('loadingErrorTitle'), {
        description: t('loadingErrorDescription')
      })
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

      const colors = ['#D4A5A5', '#FFB6C1', '#9D4EDD', '#FFD700']

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
        // Filter out deleted items before processing
        const newContent = result.data.filter(c =>
          !previousContentIds.current.has(c.id) &&
          !deletedContentIds.current.has(c.id)
        )

        if (newContent.length > 0) {
          // Update content list (prepend new items)
          setContent(prev => {
            const existingIds = new Set(prev.map(c => c.id))
            const toAdd = newContent.filter(c =>
              !existingIds.has(c.id) &&
              !deletedContentIds.current.has(c.id)
            )

            if (toAdd.length > 0) {
              return [...toAdd, ...prev]
            }
            return prev
          })

          // Trigger confetti and notification
          const contentType = newContent[0].type === 'text' ? 'messaggio' :
                             newContent[0].type === 'image' ? 'foto' : 'video'
          const message = newContent.length === 1
            ? t('newContentNotification', { type: contentType })
            : t('newContentMultiple', { count: newContent.length })

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
        toast.error(t('updateErrorTitle'), {
          description: t('updateErrorDescription')
        })
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
    { id: 'all' as const, label: t('filters.all'), icon: '🎁', count: content.length },
    { id: 'text' as const, label: t('filters.text'), icon: '📝', count: content.filter(c => c.type === 'text').length },
    { id: 'image' as const, label: t('filters.image'), icon: '📸', count: content.filter(c => c.type === 'image').length },
    { id: 'video' as const, label: t('filters.video'), icon: '🎥', count: content.filter(c => c.type === 'video').length },
  ]

  if (content.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">🎈</div>
        <h3 className="text-2xl font-bold mb-2">{t('empty.noContentYet')}</h3>
        <p className="text-muted-foreground">
          {t('empty.friendsPreparing')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="region" aria-label={t('contentRegionAriaLabel')}>
      {/* Sound Toggle (only for VIP/Admin) */}
      {(userRole === 'vip' || userRole === 'admin') && (
        <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-3 md:p-4 flex items-center justify-end border border-white/20">
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
            <span className="text-sm md:text-base text-gray-700">{t('soundToggle')}</span>
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
      <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-3 md:p-4 border border-white/20">
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
            ? t('totalCount', { count: content.length })
            : t('filteredCount', { filtered: filteredContent.length, total: content.length })}
        </motion.p>
      </div>

      {/* Masonry Grid */}
      {isLoading ? (
        <ContentCardSkeletonGrid count={9} />
      ) : filteredContent.length === 0 ? (
        // Empty state per filtri specifici
        <motion.div
          key={filter}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-12 text-center"
        >
          <div className="text-6xl mb-4">
            {filter === 'text' && '✍️'}
            {filter === 'image' && '📸'}
            {filter === 'video' && '🎥'}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {filter === 'text' && t('empty.noText')}
            {filter === 'image' && t('empty.noImages')}
            {filter === 'video' && t('empty.noVideos')}
          </h3>
          <p className="text-muted-foreground">
            {filter === 'text' && t('empty.beFirstToUpload')}
            {filter === 'image' && t('empty.shareMemories')}
            {filter === 'video' && t('empty.startDances')}
          </p>
        </motion.div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Masonry
                breakpointCols={{
                  default: 3,
                  1024: 2,
                  640: 1
                }}
                className="flex -ml-8 w-auto"
                columnClassName="pl-8 bg-clip-padding"
              >
                {filteredContent.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="mb-8"
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
              </Masonry>
            </motion.div>
          </AnimatePresence>

          {/* Infinite scroll trigger and loading indicator */}
          {hasMore && (
            <div ref={observerTarget} className="mt-8 flex justify-center">
              {isLoadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <ContentCardSkeletonGrid count={6} />
                  <p className="text-sm text-muted-foreground">{t('loadingMore')}</p>
                </div>
              )}
            </div>
          )}

          {!hasMore && filteredContent.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('allContentViewed', { count: filteredContent.length })}
              </p>
            </div>
          )}
        </>
      )}

      {/* Lightbox - solo per immagini */}
      {lightboxContent && lightboxContent.type === 'image' && (
        <Lightbox
          open={true}
          close={() => setLightboxContent(null)}
          slides={
            filteredContent
              .filter(item => item.type === 'image')
              .map(item => ({
                src: item.media_url || '',
              }))
          }
          index={
            filteredContent
              .filter(item => item.type === 'image')
              .findIndex(item => item.id === lightboxContent.id)
          }
        />
      )}

      {/* Modal per video */}
      <AnimatePresence>
        {lightboxContent && lightboxContent.type === 'video' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxContent(null)}
          >
            <button
              onClick={() => setLightboxContent(null)}
              className="absolute top-4 right-4 text-white bg-black/70 rounded-full p-3 hover:bg-black/80 transition-colors"
              aria-label={t('closeButton')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <video
              src={lightboxContent.media_url || ''}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            >
              {t('videoNotSupported')}
            </video>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
