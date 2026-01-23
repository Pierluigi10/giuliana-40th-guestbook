'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { addReaction, removeReaction } from '@/actions/reactions'
import Image from 'next/image'
import type { ContentRow, ReactionRow, ProfileRow } from '@/lib/supabase/types'

interface Content {
  id: ContentRow['id']
  type: ContentRow['type']
  text_content: ContentRow['text_content']
  media_url: ContentRow['media_url']
  approved_at: ContentRow['approved_at']
  user_id: ContentRow['user_id']
  profiles: Pick<ProfileRow, 'full_name'> | null
  reactions: Array<Pick<ReactionRow, 'id' | 'emoji' | 'user_id'>>
}

interface ContentCardProps {
  content: Content
  userId: string
  onOpenLightbox?: () => void
  animationDelay?: number
}

const availableEmojis = ['❤️', '🎉', '😂', '🥰', '👏', '🔥', '✨', '💖']

export function ContentCard({ content, userId, onOpenLightbox, animationDelay = 0 }: ContentCardProps) {
  const [reactions, setReactions] = useState(content.reactions)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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

    if (userReaction) {
      // Remove reaction
      const result = await removeReaction(userReaction.id)
      if (result.success) {
        setReactions(prev => prev.filter(r => r.id !== userReaction.id))
      } else {
        toast.error('Errore durante la rimozione della reaction')
      }
    } else {
      // Add reaction
      const result = await addReaction(content.id, emoji)
      if (result.success && result.reaction) {
        setReactions(prev => [...prev, result.reaction!])
      } else {
        toast.error('Errore durante l\'aggiunta della reaction')
      }
    }
  }

  const gradients = [
    'from-birthday-pink/20 to-birthday-purple/20',
    'from-birthday-purple/20 to-birthday-gold/20',
    'from-birthday-gold/20 to-birthday-sky/20',
    'from-birthday-sky/20 to-birthday-pink/20',
  ]

  const gradient = gradients[content.id.charCodeAt(0) % gradients.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay, ease: 'easeOut' }}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] transform"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl">
            {content.type === 'text' ? '💬' : content.type === 'image' ? '📸' : '🎥'}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">
              {content.profiles?.full_name || 'Anonimo'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {content.approved_at && new Date(content.approved_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {content.type === 'text' && (
          <div className={`bg-gradient-to-br ${gradient} rounded-lg p-4 min-h-[100px] flex items-center`}>
            <p className="text-base whitespace-pre-wrap leading-relaxed">
              {content.text_content}
            </p>
          </div>
        )}

        {content.type === 'image' && content.media_url && (
          <div
            className="relative rounded-lg overflow-hidden cursor-pointer group"
            onClick={onOpenLightbox}
          >
            <Image
              src={content.media_url}
              alt="Content"
              width={600}
              height={400}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Clicca per ingrandire
              </span>
            </div>
          </div>
        )}

        {content.type === 'video' && content.media_url && (
          <div
            className="relative rounded-lg overflow-hidden cursor-pointer bg-black"
            onClick={onOpenLightbox}
          >
            <video
              src={content.media_url}
              className="w-full h-auto"
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <svg className="w-8 h-8 text-birthday-purple ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Reaction counts */}
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                hasUserReacted(emoji)
                  ? 'bg-gradient-to-r from-birthday-pink to-birthday-purple text-white scale-110'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span className="font-medium">{count}</span>
            </button>
          ))}

          {/* Add reaction button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl transition-all hover:scale-110"
              title="Aggiungi reaction"
            >
              +
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-2 flex gap-1 z-20">
                  {availableEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleReactionClick(emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-2xl transition-all hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
