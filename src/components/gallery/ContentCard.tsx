'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { addReaction, removeReaction } from '@/actions/reactions'
import { deleteContent } from '@/actions/content'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import type { ContentRow, ReactionRow, ProfileRow } from '@/lib/supabase/types'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { analyzeNetworkError } from '@/lib/network-errors'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatRelativeDate } from '@/lib/date-utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Emoji to text mapping for screen readers
function emojiToText(emoji: string): string {
  const emojiMap: Record<string, string> = {
    '❤️': 'cuore',
    '🎉': 'coriandoli festa',
    '😂': 'risata',
    '🥰': 'occhi a cuore',
    '👏': 'applausi',
    '🔥': 'fuoco',
    '✨': 'stelle',
    '💖': 'cuore brillante',
  }
  return emojiMap[emoji] || 'reazione'
}

interface Content {
  id: ContentRow['id']
  type: ContentRow['type']
  text_content: ContentRow['text_content']
  media_url: ContentRow['media_url']
  approved_at: ContentRow['approved_at']
  user_id: ContentRow['user_id']
  profiles: { full_name: string | null } | null
  reactions: Array<Pick<ReactionRow, 'id' | 'emoji' | 'user_id'> & {
    profiles: { full_name: string | null } | null
  }>
}

interface ContentCardProps {
  content: Content
  userId: string
  userRole: string
  onOpenLightbox?: () => void
  onDelete?: (contentId: string) => void
  animationDelay?: number
}

const availableEmojis = ['❤️', '🎉', '😂', '🥰', '👏', '🔥', '✨', '💖']

export function ContentCard({ content, userId, userRole, onOpenLightbox, onDelete, animationDelay = 0 }: ContentCardProps) {
  const [reactions, setReactions] = useState(content.reactions)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFullText, setShowFullText] = useState(false)

  // Determina se il testo è troppo lungo (più di 150 caratteri o 4 righe circa)
  const isLongText = content.text_content && content.text_content.length > 150
  const previewText = isLongText ? content.text_content!.slice(0, 150) + '...' : content.text_content

  // Use ref to track showEmojiPicker state for keyboard listener
  const showEmojiPickerRef = useRef(showEmojiPicker)

  useEffect(() => {
    showEmojiPickerRef.current = showEmojiPicker
  }, [showEmojiPicker])

  // Keyboard navigation: ESC key closes emoji picker
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEmojiPickerRef.current) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, []) // Empty dependency array - only mount/unmount

  // Count reactions by emoji
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Check if user has reacted with specific emoji
  const hasUserReacted = (emoji: string) => {
    return reactions.some(r => r.emoji === emoji && r.user_id === userId)
  }

  const handleReactionClick = async (emoji: string) => {
    const userReaction = reactions.find(r => r.emoji === emoji && r.user_id === userId)

    try {
      if (userReaction) {
        // Remove reaction
        const result = await removeReaction(userReaction.id)
        if (result.success) {
          setReactions(prev => prev.filter(r => r.id !== userReaction.id))
        } else {
          const errorInfo = analyzeNetworkError('error' in result ? result.error : 'Errore sconosciuto')
          toast.error('Errore rimozione reaction', {
            description: errorInfo.userMessage
          })
        }
      } else {
        // Add reaction with celebration!
        const result = await addReaction(content.id, emoji)
        if (result.success && result.reaction) {
          setReactions(prev => [...prev, result.reaction!])

          // Small confetti burst for reaction
          const colors = ['#D4A5A5', '#FFB6C1', '#9D4EDD', '#FFD700']
          confetti({
            particleCount: 20,
            spread: 30,
            origin: { x: 0.5, y: 0.5 },
            colors,
            startVelocity: 20,
          })
        } else {
          const errorInfo = analyzeNetworkError('error' in result ? result.error : 'Errore sconosciuto')
          toast.error('Errore aggiunta reaction', {
            description: errorInfo.userMessage
          })
        }
      }
    } catch (error) {
      console.error('[ContentCard] Reaction error:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Errore nella reaction', {
        description: errorInfo.userMessage
      })
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteContent(content.id)
      if (result.success) {
        toast.success('Contenuto eliminato')
        onDelete?.(content.id)
      } else {
        const errorInfo = analyzeNetworkError(result.error)
        toast.error('Errore eliminazione', {
          description: errorInfo.userMessage
        })
      }
    } catch (error) {
      console.error('[ContentCard] Delete error:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Errore eliminazione', {
        description: errorInfo.userMessage
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const canDelete = userRole === 'admin' || content.user_id === userId

  // Gradienti soft per gli sfondi (più interessanti dei colori piatti)
  const backgroundGradients = [
    'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100',
    'bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100',
    'bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100',
    'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100',
    'bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-100',
  ]

  const bgGradient = backgroundGradients[content.id.charCodeAt(0) % backgroundGradients.length]

  // Badge icone per tipo di contenuto
  const contentTypeConfig = {
    text: { icon: '📝', label: 'Messaggio', ariaLabel: 'Contenuto di tipo messaggio' },
    image: { icon: '📸', label: 'Foto', ariaLabel: 'Contenuto di tipo foto' },
    video: { icon: '🎥', label: 'Video', ariaLabel: 'Contenuto di tipo video' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: animationDelay,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-all transform border border-gray-100"
    >
      {/* Content - Prominente, stile Pinterest */}
      <div className="relative">
        {/* Badge tipo contenuto - visibile nell'angolo in alto a sinistra */}
        <div
          className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5"
          role="status"
          aria-label={contentTypeConfig[content.type].ariaLabel}
        >
          <span className="text-sm" aria-hidden="true">
            {contentTypeConfig[content.type].icon}
          </span>
          <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
            {contentTypeConfig[content.type].label}
          </span>
        </div>

        {content.type === 'text' && (
          <div className={`${bgGradient} p-8 md:p-12 relative min-h-[200px] flex items-center justify-center`}>
            {/* Virgoletta SVG decorativa - inizio */}
            <svg
              className="absolute top-4 left-4 w-8 h-8 md:w-10 md:h-10 text-birthday-purple/10"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>

            <p
              className="text-gray-900 text-xl md:text-2xl leading-relaxed font-serif relative z-10 px-6 md:px-8 whitespace-pre-wrap font-semibold"
            >
              {DOMPurify.sanitize(previewText || '', {
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: []
              })}
            </p>

            {/* Virgoletta SVG decorativa - fine */}
            <svg
              className="absolute bottom-4 right-4 w-8 h-8 md:w-10 md:h-10 text-birthday-purple/10 rotate-180"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>

            {isLongText && (
              <button
                onClick={() => setShowFullText(true)}
                className="mt-4 text-sm text-birthday-purple hover:text-birthday-pink font-semibold transition-colors relative z-10"
              >
                Leggi tutto →
              </button>
            )}
          </div>
        )}

        {content.type === 'image' && content.media_url && (
          <div>
            <motion.div
              className="relative overflow-hidden cursor-pointer group bg-black"
              onClick={onOpenLightbox}
            >
              <Image
                src={content.media_url}
                alt="Content"
                width={800}
                height={600}
                loading="lazy"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <motion.div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.span
                  className="text-white text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Clicca per ingrandire
                </motion.span>
              </motion.div>
            </motion.div>
            {/* Caption se presente text_content */}
            {content.text_content && (
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {DOMPurify.sanitize(content.text_content, {
                    ALLOWED_TAGS: [],
                    ALLOWED_ATTR: []
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {content.type === 'video' && content.media_url && (
          <div>
            <motion.div
              className="relative overflow-hidden cursor-pointer bg-black"
              onClick={onOpenLightbox}
            >
              <video
                src={content.media_url}
                className="w-full h-48 object-cover"
                preload="metadata"
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black/30"
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-8 h-8 text-birthday-purple ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
            {/* Caption se presente text_content */}
            {content.text_content && (
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {DOMPurify.sanitize(content.text_content, {
                    ALLOWED_TAGS: [],
                    ALLOWED_ATTR: []
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delete button overlay - top right */}
        {canDelete && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              disabled={isDeleting}
              className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-9 md:h-9 rounded-full bg-black/60 hover:bg-red-500 active:bg-red-600 text-white flex items-center justify-center transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 backdrop-blur-sm touch-manipulation"
              aria-label="Elimina questo contenuto"
            >
              <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {showDeleteConfirm && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDeleteConfirm(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl p-3 md:p-3 z-20 min-w-[200px] md:min-w-[200px]">
                  <p className="text-sm md:text-sm font-semibold mb-1 text-gray-900">Eliminare questo contenuto?</p>
                  <p className="text-xs md:text-xs mb-3 text-gray-600">Questa azione non può essere annullata</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 min-h-[44px] bg-red-500 text-white px-3 py-2 rounded text-sm md:text-sm font-medium hover:bg-red-600 active:bg-red-700 disabled:opacity-50 touch-manipulation"
                    >
                      {isDeleting ? 'Eliminazione...' : 'Sì, elimina'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 min-h-[44px] bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm md:text-sm font-medium hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 touch-manipulation"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Author info + Reactions - Stile Pinterest clean */}
      <div className="p-4">
        <div className="flex items-center gap-3 justify-between mb-3">
          {/* Author info - Left */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar
              name={content.profiles?.full_name || 'Anonimo'}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {DOMPurify.sanitize(content.profiles?.full_name || 'Anonimo', {
                  ALLOWED_TAGS: [],
                  ALLOWED_ATTR: []
                })}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                {content.approved_at && formatRelativeDate(content.approved_at)}
              </p>
            </div>
          </div>

          {/* Reactions - Right */}
          <div
            className="flex items-center gap-1 flex-shrink-0"
            role="group"
            aria-label="Sezione reazioni al contenuto"
          >
            {/* Reaction counts */}
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <HoverCard key={emoji}>
                <HoverCardTrigger asChild>
                  <motion.button
                    onClick={() => handleReactionClick(emoji)}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    animate={hasUserReacted(emoji) ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    } : {}}
                    transition={{ duration: 0.3 }}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 px-2 md:px-1.5 py-1 md:py-0.5 rounded-full text-xs md:text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple focus-visible:ring-offset-1 touch-manipulation ${
                      hasUserReacted(emoji)
                        ? 'bg-gradient-to-r from-birthday-pink to-birthday-purple text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                    aria-label={`${emojiToText(emoji)}, ${count} ${count === 1 ? 'persona ha' : 'persone hanno'} reagito. ${
                      hasUserReacted(emoji) ? 'Già reagito, clicca per rimuovere' : 'Clicca per reagire'
                    }`}
                    aria-pressed={hasUserReacted(emoji)}
                  >
                    <span className="text-base md:text-sm" role="img" aria-label={emojiToText(emoji)}>
                      {emoji}
                    </span>
                    <span className="font-medium text-xs md:text-[10px]">{count}</span>
                  </motion.button>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-auto max-w-xs p-3" sideOffset={5} role="tooltip">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Hanno reagito:
                    </p>
                    <ul className="text-sm space-y-0.5">
                      {reactions
                        .filter(r => r.emoji === emoji)
                        .map(r => (
                          <li key={r.id} className="text-foreground">
                            {r.profiles?.full_name || 'Utente anonimo'}
                          </li>
                        ))}
                    </ul>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}

            {/* Add reaction button */}
            <div className="relative">
              <motion.button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-6 md:h-6 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-base md:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-gold focus-visible:ring-offset-1 touch-manipulation"
                aria-label="Apri selettore emoji per aggiungere reazione"
                aria-expanded={showEmojiPicker}
                aria-controls="emoji-picker-menu"
              >
                <span aria-hidden="true">+</span>
                <span className="sr-only">Aggiungi reazione</span>
              </motion.button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEmojiPicker(false)}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-2 md:p-2 flex flex-wrap gap-2 md:gap-1 z-20 max-w-[200px] md:max-w-none"
                    id="emoji-picker-menu"
                    role="menu"
                    aria-label="Selettore emoji"
                  >
                    {availableEmojis.map(emoji => (
                      <motion.button
                        key={emoji}
                        onClick={() => {
                          handleReactionClick(emoji)
                          setShowEmojiPicker(false)
                        }}
                        whileHover={{ scale: 1.3, rotate: [0, -10, 10, -10, 0] }}
                        whileTap={{ scale: 0.9 }}
                        className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-2xl md:text-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birthday-purple touch-manipulation"
                        role="menuitem"
                        aria-label={`Reagisci con ${emojiToText(emoji)}`}
                      >
                        <span role="img" aria-label={emojiToText(emoji)}>
                          {emoji}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Text Modal */}
      <Dialog open={showFullText} onOpenChange={setShowFullText}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <UserAvatar
                name={content.profiles?.full_name || 'Anonimo'}
                size="md"
              />
              <div>
                <p className="text-lg font-semibold">
                  {DOMPurify.sanitize(content.profiles?.full_name || 'Anonimo', {
                    ALLOWED_TAGS: [],
                    ALLOWED_ATTR: []
                  })}
                </p>
                <p className="text-sm text-gray-500 font-normal">
                  {content.approved_at && formatRelativeDate(content.approved_at)}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 relative px-8">
            {/* Virgoletta SVG decorativa - inizio */}
            <svg
              className="absolute top-0 left-0 w-10 h-10 text-birthday-purple/10"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>

            <p className="text-gray-900 text-xl leading-relaxed font-serif whitespace-pre-wrap font-semibold">
              {DOMPurify.sanitize(content.text_content || '', {
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: []
              })}
            </p>

            {/* Virgoletta SVG decorativa - fine */}
            <svg
              className="absolute bottom-0 right-0 w-10 h-10 text-birthday-purple/10 rotate-180"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
