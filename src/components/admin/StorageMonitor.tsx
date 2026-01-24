'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Database, Image, Video } from 'lucide-react'
import { fetchWithRetry, analyzeNetworkError } from '@/lib/network-errors'
import { toast } from 'sonner'

interface StorageStats {
  totalMB: number
  limitMB: number
  percentageUsed: number
  fileCount: number
  filesByType: {
    images: number
    videos: number
  }
}

export function StorageMonitor() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetchWithRetry('/api/storage/stats', {
        timeout: 10000,
        maxRetries: 2
      })
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('[StorageMonitor] Failed to fetch stats:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Caricamento statistiche storage non riuscito', {
        description: errorInfo.userMessage,
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />
    )
  }

  if (!stats) {
    return null
  }

  const { totalMB, limitMB, percentageUsed, fileCount, filesByType } = stats

  // Alert color based on percentage
  const getAlertColor = () => {
    if (percentageUsed >= 90) return 'bg-red-500'
    if (percentageUsed >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTextColor = () => {
    if (percentageUsed >= 90) return 'text-red-600'
    if (percentageUsed >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Storage Supabase</h3>

        {percentageUsed >= 70 && (
          <AlertTriangle className={`w-5 h-5 ml-auto ${percentageUsed >= 90 ? 'text-red-600' : 'text-yellow-600'}`} />
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className={`font-semibold ${getTextColor()}`}>
            {totalMB.toFixed(2)} MB / {limitMB} MB
          </span>
          <span className={`font-semibold ${getTextColor()}`}>
            {percentageUsed.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getAlertColor()} transition-all duration-500`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning messages */}
      {percentageUsed >= 90 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
          <p className="text-sm text-red-700 font-medium">
            Storage quasi pieno! Considera di eliminare contenuti rifiutati o aumentare il piano Supabase.
          </p>
        </div>
      )}

      {percentageUsed >= 70 && percentageUsed < 90 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
          <p className="text-sm text-yellow-700 font-medium">
            Storage oltre il 70%. Monitora l&apos;utilizzo.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <Database className="w-6 h-6 mx-auto text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-700">{fileCount}</p>
          <p className="text-xs text-gray-500">File Totali</p>
        </div>

        <div>
          <Image className="w-6 h-6 mx-auto text-blue-400 mb-1" />
          <p className="text-2xl font-bold text-gray-700">{filesByType.images}</p>
          <p className="text-xs text-gray-500">Immagini</p>
        </div>

        <div>
          <Video className="w-6 h-6 mx-auto text-purple-400 mb-1" />
          <p className="text-2xl font-bold text-gray-700">{filesByType.videos}</p>
          <p className="text-xs text-gray-500">Video</p>
        </div>
      </div>

      <button
        onClick={fetchStats}
        className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Aggiorna dati
      </button>
    </div>
  )
}
