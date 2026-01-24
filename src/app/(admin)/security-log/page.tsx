'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

interface BlockedAttempt {
  timestamp: number
  timestampFormatted: string
  ip: string
  email: string
  reason: 'honeypot' | 'rate_limit'
  reasonLabel: string
  userAgent?: string
}

interface SecurityStats {
  total: number
  honeypot: number
  rateLimit: number
  last24h: number
  lastHour: number
}

export default function SecurityLogPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSecurityLog = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/security-log')
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login')
          return
        }
        throw new Error('Errore nel caricamento dei log')
      }
      const data = await response.json()
      setAttempts(data.attempts || [])
      setStats(data.stats || null)
    } catch (err) {
      setError('Impossibile caricare i log di sicurezza')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityLog()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-birthday-purple" />
            <h1 className="text-2xl font-bold">Log di Sicurezza</h1>
          </div>
        </div>
        <Button onClick={fetchSecurityLog} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Totale bloccati</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Bot (honeypot)</div>
            <div className="text-2xl font-bold text-orange-600">{stats.honeypot}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Rate limit</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.rateLimit}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Ultime 24h</div>
            <div className="text-2xl font-bold text-red-600">{stats.last24h}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Ultima ora</div>
            <div className="text-2xl font-bold text-red-700">{stats.lastHour}</div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Sistema di protezione anti-spam attivo</p>
            <p className="text-blue-700 dark:text-blue-300">
              Honeypot: campo invisibile che solo i bot compilano • Rate limiting: max 5 registrazioni per IP in 10 minuti
            </p>
          </div>
        </div>
      </div>

      {/* Blocked Attempts Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="font-semibold">Tentativi bloccati (ultimi 50)</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Caricamento...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">{error}</div>
        ) : attempts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nessun tentativo di spam bloccato</p>
            <p className="text-sm mt-1">Il sistema di protezione è attivo e funzionante</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 text-sm">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Data/Ora</th>
                  <th className="px-4 py-3 text-left font-medium">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">IP</th>
                  <th className="px-4 py-3 text-left font-medium">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attempts.map((attempt, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {attempt.timestampFormatted}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.reason === 'honeypot'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                        }`}
                      >
                        {attempt.reasonLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {attempt.email}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {attempt.ip}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                      {attempt.userAgent || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          <strong>Nota:</strong> I log vengono conservati in memoria e si resettano al riavvio del server.
          Per un monitoraggio permanente, considera l'utilizzo di un database o servizio di logging esterno.
        </p>
      </div>
    </div>
  )
}
