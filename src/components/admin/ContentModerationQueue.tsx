'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { approveContent, rejectContent } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import Image from 'next/image'

interface Content {
  id: string
  type: 'text' | 'image' | 'video'
  text_content?: string | null
  media_url?: string | null
  created_at: string
  user_id: string
  profiles: {
    full_name: string
    email: string
  } | null
}

interface ContentModerationQueueProps {
  initialContent: Content[]
}

export function ContentModerationQueue({ initialContent }: ContentModerationQueueProps) {
  const [content, setContent] = useState<Content[]>(initialContent)
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [lightboxContent, setLightboxContent] = useState<Content | null>(null)

  const filteredContent = content.filter((item) => {
    if (filter === 'all') return true
    return item.type === filter
  })

  const handleApprove = async (contentId: string) => {
    setLoadingId(contentId)

    try {
      const result = await approveContent(contentId)

      if (result.success) {
        toast.success('Contenuto approvato! ✅')
        setContent((prev) => prev.filter((item) => item.id !== contentId))
      } else {
        toast.error(result.error || 'Errore durante l\'approvazione')
      }
    } catch (error) {
      toast.error('Si è verificato un errore')
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (contentId: string) => {
    setLoadingId(contentId)

    try {
      const result = await rejectContent(contentId)

      if (result.success) {
        toast.success('Contenuto rifiutato')
        setContent((prev) => prev.filter((item) => item.id !== contentId))
      } else {
        toast.error(result.error || 'Errore durante il rifiuto')
      }
    } catch (error) {
      toast.error('Si è verificato un errore')
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  const filters = [
    { id: 'all' as const, label: 'Tutti', icon: '📋' },
    { id: 'text' as const, label: 'Testo', icon: '📝' },
    { id: 'image' as const, label: 'Foto', icon: '📸' },
    { id: 'video' as const, label: 'Video', icon: '🎥' },
  ]

  if (content.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-2xl font-bold mb-2">Tutto approvato!</h3>
        <p className="text-muted-foreground">
          Non ci sono contenuti in attesa di approvazione
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats & Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-lg font-medium">
            {filteredContent.length} contenut{filteredContent.length === 1 ? 'o' : 'i'} in attesa
          </div>

          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-birthday-purple text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 gap-6">
        {filteredContent.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {item.profiles?.full_name || 'Utente sconosciuto'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.profiles?.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleString('it-IT')}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.type === 'text' ? '📝 Testo' : item.type === 'image' ? '📸 Foto' : '🎥 Video'}
                </span>
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                {item.type === 'text' && (
                  <div className="bg-gradient-to-r from-birthday-pink/10 to-birthday-purple/10 rounded-lg p-4 border border-gray-200">
                    <p className="whitespace-pre-wrap">{item.text_content}</p>
                  </div>
                )}

                {item.type === 'image' && item.media_url && (
                  <div
                    className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxContent(item)}
                  >
                    <Image
                      src={item.media_url}
                      alt="Content preview"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[400px] object-contain bg-gray-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                      <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm opacity-0 hover:opacity-100 transition-opacity">
                        Clicca per ingrandire
                      </span>
                    </div>
                  </div>
                )}

                {item.type === 'video' && item.media_url && (
                  <div className="rounded-lg overflow-hidden bg-black">
                    <video
                      src={item.media_url}
                      controls
                      className="w-full h-auto max-h-[400px]"
                    >
                      Il tuo browser non supporta la riproduzione video.
                    </video>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={loadingId === item.id}
                  className="flex-1 rounded-md bg-green-500 px-4 py-3 text-sm font-medium text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loadingId === item.id && <Spinner size="sm" className="text-white" />}
                  {loadingId === item.id ? 'Approvazione...' : '✅ Approva'}
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  disabled={loadingId === item.id}
                  className="flex-1 rounded-md bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loadingId === item.id && <Spinner size="sm" className="text-white" />}
                  {loadingId === item.id ? 'Rifiuto...' : '❌ Rifiuta'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxContent && lightboxContent.type === 'image' && lightboxContent.media_url && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxContent(null)}
        >
          <button
            onClick={() => setLightboxContent(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
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
          <Image
            src={lightboxContent.media_url}
            alt="Full size preview"
            width={1920}
            height={1080}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
