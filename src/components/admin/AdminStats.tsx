'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Image, Video, CheckCircle, XCircle, Clock, TrendingUp, Activity } from 'lucide-react'
import type { AdminStats } from '@/lib/supabase/queries'
import { fetchWithRetry, analyzeNetworkError } from '@/lib/network-errors'
import { toast } from 'sonner'

export function AdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetchWithRetry('/api/admin/stats', {
        timeout: 10000,
        maxRetries: 2
      })
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('[AdminStats] Failed to fetch stats:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Caricamento statistiche non riuscito', {
        description: errorInfo.userMessage,
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-muted-foreground">Impossibile caricare le statistiche</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-birthday-purple text-white rounded-md hover:bg-birthday-purple/90"
        >
          Riprova
        </button>
      </div>
    )
  }

  const { users, content, recentActivity, contentOverTime } = stats

  return (
    <div className="space-y-6">
      {/* Users Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-birthday-purple" />
          <h3 className="text-lg font-semibold">Utenti</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-800">{users.total}</p>
            <p className="text-sm text-gray-600 mt-1">Totale</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{users.approved}</p>
            <p className="text-sm text-gray-600 mt-1">Approvati</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{users.pending}</p>
            <p className="text-sm text-gray-600 mt-1">In attesa</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {users.byRole.admin}/{users.byRole.vip}/{users.byRole.guest}
            </p>
            <p className="text-xs text-gray-600 mt-1">Admin/VIP/Guest</p>
          </div>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-birthday-purple" />
          <h3 className="text-lg font-semibold">Contenuti</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-800">{content.total}</p>
            <p className="text-sm text-gray-600 mt-1">Totale</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
            <p className="text-3xl font-bold text-yellow-600">{content.pending}</p>
            <p className="text-sm text-gray-600 mt-1">In attesa</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-3xl font-bold text-green-600">{content.approved}</p>
            <p className="text-sm text-gray-600 mt-1">Approvati</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="w-6 h-6 mx-auto text-red-600 mb-2" />
            <p className="text-3xl font-bold text-red-600">{content.rejected}</p>
            <p className="text-sm text-gray-600 mt-1">Rifiutati</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <FileText className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{content.byType.text}</p>
            <p className="text-sm text-gray-600 mt-1">Testi</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Image className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{content.byType.image}</p>
            <p className="text-sm text-gray-600 mt-1">Immagini</p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <Video className="w-6 h-6 mx-auto text-pink-600 mb-2" />
            <p className="text-2xl font-bold text-pink-600">{content.byType.video}</p>
            <p className="text-sm text-gray-600 mt-1">Video</p>
          </div>
        </div>
      </div>

      {/* Content Over Time Chart */}
      {contentOverTime.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-birthday-purple" />
            <h3 className="text-lg font-semibold">Contenuti negli ultimi 30 giorni</h3>
          </div>
          <div className="space-y-2">
            {contentOverTime.slice(-7).map((day) => {
              const maxValue = Math.max(day.approved, day.pending, day.rejected, 1)
              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div className="flex-1 flex gap-1 h-6">
                    {day.approved > 0 && (
                      <div
                        className="bg-green-500 rounded"
                        style={{ width: `${(day.approved / maxValue) * 100}%` }}
                        title={`${day.approved} approvati`}
                      />
                    )}
                    {day.pending > 0 && (
                      <div
                        className="bg-yellow-500 rounded"
                        style={{ width: `${(day.pending / maxValue) * 100}%` }}
                        title={`${day.pending} in attesa`}
                      />
                    )}
                    {day.rejected > 0 && (
                      <div
                        className="bg-red-500 rounded"
                        style={{ width: `${(day.rejected / maxValue) * 100}%` }}
                        title={`${day.rejected} rifiutati`}
                      />
                    )}
                  </div>
                  <div className="w-20 text-xs text-gray-500 text-right">
                    {day.approved + day.pending + day.rejected} totali
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              Approvati
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              In attesa
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              Rifiutati
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-birthday-purple" />
            <h3 className="text-lg font-semibold">Attività Recente</h3>
          </div>
          <button
            onClick={fetchStats}
            className="text-sm text-birthday-purple hover:underline"
          >
            Aggiorna
          </button>
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nessuna attività recente</p>
          ) : (
            recentActivity.map((activity) => {
              const getIcon = () => {
                switch (activity.type) {
                  case 'upload':
                    return activity.content_type === 'text' ? (
                      <FileText className="w-4 h-4 text-blue-500" />
                    ) : activity.content_type === 'image' ? (
                      <Image className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Video className="w-4 h-4 text-pink-500" />
                    )
                  case 'approval':
                    return <CheckCircle className="w-4 h-4 text-green-500" />
                  case 'rejection':
                    return <XCircle className="w-4 h-4 text-red-500" />
                }
              }

              const getLabel = () => {
                switch (activity.type) {
                  case 'upload':
                    return `ha caricato un ${activity.content_type === 'text' ? 'messaggio' : activity.content_type === 'image' ? 'immagine' : 'video'}`
                  case 'approval':
                    return `ha approvato un ${activity.content_type === 'text' ? 'messaggio' : activity.content_type === 'image' ? 'immagine' : 'video'}`
                  case 'rejection':
                    return `ha rifiutato un ${activity.content_type === 'text' ? 'messaggio' : activity.content_type === 'image' ? 'immagine' : 'video'}`
                }
              }

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {getIcon()}
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      <span className="text-gray-600">{getLabel()}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
