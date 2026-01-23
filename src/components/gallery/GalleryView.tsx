'use client'

import { useState, useEffect } from 'react'
import { ContentCard } from './ContentCard'
import { ContentCardSkeletonGrid } from '@/components/loading/ContentCardSkeleton'
import confetti from 'canvas-confetti'
import type { ContentRow, ReactionRow, ProfileRow } from '@/lib/supabase/types'

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

  const handleContentDeleted = (contentId: string) => {
    setContent(prev => prev.filter(item => item.id !== contentId))
    if (lightboxContent?.id === contentId) {
      setLightboxContent(null)
    }
  }

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
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-wrap justify-center gap-3">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                filter === f.id
                  ? 'bg-gradient-to-r from-birthday-pink to-birthday-purple text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2 text-lg">{f.icon}</span>
              {f.label}
              <span className="ml-2 opacity-75">({f.count})</span>
            </button>
          ))}
        </div>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          {filteredContent.length === content.length
            ? `${content.length} messaggi totali`
            : `Mostrando ${filteredContent.length} di ${content.length}`}
        </p>
      </div>

      {/* Masonry Grid */}
      {isLoading ? (
        <ContentCardSkeletonGrid count={9} />
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredContent.map((item, index) => (
            <div key={item.id} className="break-inside-avoid">
              <ContentCard
                content={item}
                userId={userId}
                userRole={userRole}
                onOpenLightbox={() => setLightboxContent(item)}
                onDelete={handleContentDeleted}
                animationDelay={index * 0.1}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxContent && (lightboxContent.type === 'image' || lightboxContent.type === 'video') && (
        <Lightbox
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
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate])

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
        aria-label="Chiudi"
      >
        <svg
          className="w-6 h-6"
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
      </button>

      {/* Previous button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onNavigate('prev')
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
        aria-label="Precedente"
      >
        <svg
          className="w-6 h-6"
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
      </button>

      {/* Next button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onNavigate('next')
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
        aria-label="Successivo"
      >
        <svg
          className="w-6 h-6"
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
      </button>

      <div onClick={(e) => e.stopPropagation()} className="max-w-7xl max-h-[90vh] w-full">
        {content.type === 'image' && content.media_url && (
          <img
            src={content.media_url}
            alt="Full size"
            className="w-full h-full object-contain"
          />
        )}

        {content.type === 'video' && content.media_url && (
          <video
            src={content.media_url}
            controls
            autoPlay
            className="w-full h-full"
          >
            Il tuo browser non supporta la riproduzione video.
          </video>
        )}
      </div>
    </div>
  )
}
