'use client'

import { useEffect, useState, useRef } from 'react'
import type { VIPStats } from '@/lib/supabase/queries'
import { Card } from '@/components/ui/card'
import { MilestoneCelebrations } from './MilestoneCelebrations'

interface StatsDashboardProps {
  initialStats: VIPStats | null
}

export function StatsDashboard({ initialStats }: StatsDashboardProps) {
  const [stats, setStats] = useState<VIPStats | null>(initialStats)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const previousStats = useRef<VIPStats | null>(initialStats)

  // Refresh stats periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true)
        const response = await fetch('/api/vip/stats')
        if (response.ok) {
          const data = await response.json()
          previousStats.current = stats
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to refresh stats:', error)
        // Keep showing previous stats on error
      } finally {
        setIsRefreshing(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return (
      <Card className="p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center text-muted-foreground">
          Caricamento statistiche...
        </div>
      </Card>
    )
  }

  const { totalFriends, totalContent, contentByType, totalReactions, recentParticipants } = stats

  // Calculate percentages for chart
  const totalForChart = contentByType.text + contentByType.image + contentByType.video
  const textPercentage = totalForChart > 0 ? (contentByType.text / totalForChart) * 100 : 0
  const imagePercentage = totalForChart > 0 ? (contentByType.image / totalForChart) * 100 : 0
  const videoPercentage = totalForChart > 0 ? (contentByType.video / totalForChart) * 100 : 0

  // Get personalized message based on stats
  const getPersonalizedMessage = () => {
    if (!stats) return null
    
    if (stats.totalFriends === 0) {
      return 'I tuoi amici stanno arrivando... 🎈'
    } else if (stats.totalFriends < 10) {
      return `Wow! ${stats.totalFriends} ${stats.totalFriends === 1 ? 'amico ha' : 'amici hanno'} già partecipato! 🎉`
    } else if (stats.totalFriends < 20) {
      return `Fantastico! ${stats.totalFriends} amici stanno condividendo i loro ricordi! ✨`
    } else {
      return `Incredibile! ${stats.totalFriends} amici ti stanno facendo gli auguri! 🎊`
    }
  }

  return (
    <div className="space-y-6">
      {/* Milestone Celebrations */}
      <MilestoneCelebrations stats={stats} previousStats={previousStats.current} />

      {/* Personalized Message */}
      {getPersonalizedMessage() && (
        <div className="bg-gradient-to-r from-birthday-pink/20 to-birthday-purple/20 rounded-lg p-4 text-center border border-birthday-purple/30">
          <p className="text-lg font-semibold text-gray-800">
            {getPersonalizedMessage()}
          </p>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Friends Count */}
        <Card className="p-6 bg-gradient-to-br from-birthday-pink/10 to-birthday-pink/5 border-birthday-pink/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Amici Partecipanti</p>
              <p className="text-3xl font-bold text-birthday-pink">{totalFriends}</p>
            </div>
            <div className="text-4xl">🎁</div>
          </div>
        </Card>

        {/* Total Content */}
        <Card className="p-6 bg-gradient-to-br from-birthday-purple/10 to-birthday-purple/5 border-birthday-purple/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Contenuti Totali</p>
              <p className="text-3xl font-bold text-birthday-purple">{totalContent}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </Card>

        {/* Reactions Count */}
        <Card className="p-6 bg-gradient-to-br from-birthday-gold/10 to-birthday-gold/5 border-birthday-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Reazioni Totali</p>
              <p className="text-3xl font-bold text-birthday-gold">{totalReactions}</p>
            </div>
            <div className="text-4xl">❤️</div>
          </div>
        </Card>

        {/* Content Breakdown */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Per Tipo</p>
              <div className="text-xs space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  <span className="font-medium">{contentByType.text} messaggi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📸</span>
                  <span className="font-medium">{contentByType.image} foto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎥</span>
                  <span className="font-medium">{contentByType.video} video</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Type Chart and Recent Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Chart */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Distribuzione Contenuti</h3>
          {totalForChart > 0 ? (
            <div className="space-y-4">
              {/* Visual Bar Chart */}
              <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex">
                {textPercentage > 0 && (
                  <div
                    className="bg-gradient-to-r from-birthday-pink to-birthday-pink/80 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${textPercentage}%` }}
                    title={`${contentByType.text} messaggi (${textPercentage.toFixed(1)}%)`}
                  >
                    {textPercentage > 10 && '📝'}
                  </div>
                )}
                {imagePercentage > 0 && (
                  <div
                    className="bg-gradient-to-r from-birthday-purple to-birthday-purple/80 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${imagePercentage}%` }}
                    title={`${contentByType.image} foto (${imagePercentage.toFixed(1)}%)`}
                  >
                    {imagePercentage > 10 && '📸'}
                  </div>
                )}
                {videoPercentage > 0 && (
                  <div
                    className="bg-gradient-to-r from-birthday-gold to-birthday-gold/80 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${videoPercentage}%` }}
                    title={`${contentByType.video} video (${videoPercentage.toFixed(1)}%)`}
                  >
                    {videoPercentage > 10 && '🎥'}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-birthday-pink to-birthday-pink/80"></div>
                    <span>Messaggi</span>
                  </div>
                  <span className="font-medium">{contentByType.text} ({textPercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-birthday-purple to-birthday-purple/80"></div>
                    <span>Foto</span>
                  </div>
                  <span className="font-medium">{contentByType.image} ({imagePercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-birthday-gold to-birthday-gold/80"></div>
                    <span>Video</span>
                  </div>
                  <span className="font-medium">{contentByType.video} ({videoPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nessun contenuto ancora</p>
          )}
        </Card>

        {/* Recent Participants */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Ultimi Partecipanti</h3>
          {recentParticipants.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentParticipants.map((participant) => (
                <div
                  key={participant.user_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-birthday-pink to-birthday-purple flex items-center justify-center text-white font-bold">
                      {participant.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{participant.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(participant.last_content_date).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs bg-birthday-purple/10 text-birthday-purple px-2 py-1 rounded-full font-medium">
                    {participant.content_count} {participant.content_count === 1 ? 'contenuto' : 'contenuti'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nessun partecipante ancora</p>
          )}
        </Card>
      </div>
    </div>
  )
}
