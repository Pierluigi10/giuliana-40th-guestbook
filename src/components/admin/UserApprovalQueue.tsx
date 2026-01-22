'use client'

import { useState } from 'react'
import { approveUser, rejectUser } from '@/actions/users'
import { useRouter } from 'next/navigation'

type Guest = {
  id: string
  email: string
  full_name: string
  created_at: string
}

export function UserApprovalQueue({ initialGuests }: { initialGuests: Guest[] }) {
  const router = useRouter()
  const [guests, setGuests] = useState(initialGuests)
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (userId: string) => {
    setLoading(userId)
    try {
      await approveUser(userId)
      setGuests(guests.filter(g => g.id !== userId))
      router.refresh()
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Errore durante l\'approvazione dell\'utente')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Sei sicuro di voler rifiutare questo utente?')) {
      return
    }

    setLoading(userId)
    try {
      await rejectUser(userId)
      setGuests(guests.filter(g => g.id !== userId))
      router.refresh()
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Errore durante il rifiuto dell\'utente')
    } finally {
      setLoading(null)
    }
  }

  if (guests.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Nessun utente da approvare</h3>
        <p className="text-sm text-muted-foreground">
          Tutti gli utenti sono stati approvati o non ci sono nuove richieste
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {guests.map((guest) => (
        <div
          key={guest.id}
          className="rounded-lg border border-border bg-card p-6 flex items-center justify-between"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{guest.full_name}</h3>
            <p className="text-sm text-muted-foreground">{guest.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registrato il {new Date(guest.created_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleReject(guest.id)}
              disabled={loading === guest.id}
              className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rifiuta
            </button>
            <button
              onClick={() => handleApprove(guest.id)}
              disabled={loading === guest.id}
              className="px-4 py-2 text-sm font-medium rounded-md bg-birthday-purple text-white hover:bg-birthday-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === guest.id ? 'Approvazione...' : 'Approva'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
