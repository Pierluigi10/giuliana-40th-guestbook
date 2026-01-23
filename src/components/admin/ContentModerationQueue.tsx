'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { approveContent, rejectContent, bulkApproveContent, bulkRejectContent } from '@/actions/content'
import { Spinner } from '@/components/loading/Spinner'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>()
    content.forEach((item) => {
      if (item.profiles?.full_name) {
        users.set(item.user_id, item.profiles.full_name)
      }
    })
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }))
  }, [content])

  // Filter and search content
  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      // Type filter
      if (filter !== 'all' && item.type !== filter) return false

      // User filter
      if (userFilter !== 'all' && item.user_id !== userFilter) return false

      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.created_at)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dateFilter === 'today' && daysDiff !== 0) return false
        if (dateFilter === 'week' && daysDiff > 7) return false
        if (dateFilter === 'month' && daysDiff > 30) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = item.profiles?.full_name?.toLowerCase().includes(query)
        const matchesEmail = item.profiles?.email?.toLowerCase().includes(query)
        const matchesText = item.text_content?.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail && !matchesText) return false
      }

      return true
    })
  }, [content, filter, userFilter, dateFilter, searchQuery])

  // Reset selection when filters change - remove items that are no longer visible
  useEffect(() => {
    const filteredIds = new Set(filteredContent.map((item) => item.id))
    setSelectedIds((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => {
        if (filteredIds.has(id)) {
          next.add(id)
        }
      })
      return next
    })
  }, [filter, userFilter, dateFilter, searchQuery]) // Only reset when filters change

  const handleApprove = async (contentId: string) => {
    setLoadingId(contentId)

    try {
      const result = await approveContent(contentId)

      if (result.success) {
        toast.success('Contenuto approvato! ✅')
        setContent((prev) => prev.filter((item) => item.id !== contentId))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(contentId)
          return next
        })
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
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(contentId)
          return next
        })
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

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContent.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredContent.map((item) => item.id)))
    }
  }

  const handleToggleSelect = (contentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(contentId)) {
        next.delete(contentId)
      } else {
        next.add(contentId)
      }
      return next
    })
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('Seleziona almeno un contenuto')
      return
    }

    setBulkLoading(true)

    try {
      const result = await bulkApproveContent(Array.from(selectedIds))

      if (result.success) {
        toast.success(`${result.count || selectedIds.size} contenut${result.count === 1 ? 'o' : 'i'} approvat${result.count === 1 ? 'o' : 'i'}! ✅`)
        setContent((prev) => prev.filter((item) => !selectedIds.has(item.id)))
        setSelectedIds(new Set())
      } else {
        toast.error(result.error || 'Errore durante l\'approvazione')
      }
    } catch (error) {
      toast.error('Si è verificato un errore')
      console.error(error)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      toast.error('Seleziona almeno un contenuto')
      return
    }

    setBulkLoading(true)

    try {
      const result = await bulkRejectContent(Array.from(selectedIds))

      if (result.success) {
        toast.success(`${result.count || selectedIds.size} contenut${result.count === 1 ? 'o' : 'i'} rifiutat${result.count === 1 ? 'o' : 'i'}`)
        setContent((prev) => prev.filter((item) => !selectedIds.has(item.id)))
        setSelectedIds(new Set())
      } else {
        toast.error(result.error || 'Errore durante il rifiuto')
      }
    } catch (error) {
      toast.error('Si è verificato un errore')
      console.error(error)
    } finally {
      setBulkLoading(false)
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

  const allSelected = filteredContent.length > 0 && selectedIds.size === filteredContent.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredContent.length

  // Handle indeterminate state for select all checkbox
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  return (
    <div className="space-y-6">
      {/* Stats & Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col gap-4">
          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cerca per nome, email o contenuto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-birthday-purple touch-manipulation"
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkLoading}
                  className="min-h-[44px] px-4 py-2.5 md:py-2 rounded-md bg-green-500 text-white text-base md:text-sm font-medium hover:bg-green-600 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  {bulkLoading && <Spinner size="sm" className="text-white" />}
                  ✅ Approva {selectedIds.size}
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={bulkLoading}
                  className="min-h-[44px] px-4 py-2.5 md:py-2 rounded-md bg-red-500 text-white text-base md:text-sm font-medium hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  {bulkLoading && <Spinner size="sm" className="text-white" />}
                  ❌ Rifiuta {selectedIds.size}
                </button>
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="text-lg font-medium">
              {filteredContent.length} contenut{filteredContent.length === 1 ? 'o' : 'i'} in attesa
              {selectedIds.size > 0 && (
                <span className="ml-2 text-sm text-birthday-purple">
                  ({selectedIds.size} selezionat{selectedIds.size === 1 ? 'o' : 'i'})
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Type Filters */}
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`min-h-[44px] px-3 md:px-4 py-2.5 md:py-2 rounded-md text-sm md:text-sm font-medium transition-colors touch-manipulation ${
                    filter === f.id
                      ? 'bg-birthday-purple text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  <span className="mr-1">{f.icon}</span>
                  {f.label}
                </button>
              ))}

              {/* User Filter */}
              {uniqueUsers.length > 0 && (
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="min-h-[44px] px-3 md:px-4 py-2.5 md:py-2 rounded-md text-base md:text-sm font-medium border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-birthday-purple touch-manipulation"
                >
                  <option value="all">👤 Tutti gli utenti</option>
                  {uniqueUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="min-h-[44px] px-3 md:px-4 py-2.5 md:py-2 rounded-md text-base md:text-sm font-medium border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-birthday-purple touch-manipulation"
              >
                <option value="all">📅 Tutte le date</option>
                <option value="today">Oggi</option>
                <option value="week">Ultima settimana</option>
                <option value="month">Ultimo mese</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Select All Checkbox */}
      {filteredContent.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              ref={selectAllCheckboxRef}
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-5 h-5 text-birthday-purple rounded focus:ring-birthday-purple"
            />
            <span className="font-medium">
              Seleziona tutti ({filteredContent.length})
            </span>
          </label>
        </div>
      )}

      {/* Content Cards */}
      <div className="grid grid-cols-1 gap-6">
        {filteredContent.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow ${
              selectedIds.has(item.id) ? 'ring-2 ring-birthday-purple' : ''
            }`}
          >
            <div className="p-6">
              {/* Header with Checkbox */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleToggleSelect(item.id)}
                    className="mt-1 w-5 h-5 text-birthday-purple rounded focus:ring-birthday-purple"
                  />
                  <div>
                    <h3 className="font-bold text-lg">
                      {DOMPurify.sanitize(item.profiles?.full_name || 'Utente sconosciuto', {
                        ALLOWED_TAGS: [],
                        ALLOWED_ATTR: []
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {DOMPurify.sanitize(item.profiles?.email || '', {
                        ALLOWED_TAGS: [],
                        ALLOWED_ATTR: []
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.type === 'text' ? '📝 Testo' : item.type === 'image' ? '📸 Foto' : '🎥 Video'}
                </span>
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                {item.type === 'text' && (
                  <div className="bg-gradient-to-r from-birthday-pink/10 to-birthday-purple/10 rounded-lg p-4 border border-gray-200">
                    <p className="whitespace-pre-wrap">
                      {DOMPurify.sanitize(item.text_content || '', {
                        ALLOWED_TAGS: [],
                        ALLOWED_ATTR: []
                      })}
                    </p>
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
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={loadingId === item.id}
                  className="flex-1 min-h-[44px] rounded-md bg-green-500 px-4 py-2.5 md:py-3 text-base md:text-sm font-medium text-white hover:bg-green-600 active:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  {loadingId === item.id && <Spinner size="sm" className="text-white" />}
                  {loadingId === item.id ? 'Approvazione...' : '✅ Approva'}
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  disabled={loadingId === item.id}
                  className="flex-1 min-h-[44px] rounded-md bg-red-500 px-4 py-2.5 md:py-3 text-base md:text-sm font-medium text-white hover:bg-red-600 active:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
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
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 md:p-4"
          onClick={() => setLightboxContent(null)}
        >
          <button
            onClick={() => setLightboxContent(null)}
            className="absolute top-2 right-2 md:top-4 md:right-4 text-white bg-black/70 rounded-full p-3 md:p-2 hover:bg-black/80 active:bg-black/90 transition-colors z-10 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          <Image
            src={lightboxContent.media_url}
            alt="Full size preview"
            width={1920}
            height={1080}
            className="max-w-full max-h-[95vh] md:max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
