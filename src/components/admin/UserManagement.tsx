'use client'

import { useEffect, useState } from 'react'
import { Users, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { fetchWithRetry, analyzeNetworkError } from '@/lib/network-errors'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'vip' | 'guest'
  is_approved: boolean
  created_at: string
  content_count?: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetchWithRetry('/api/admin/users', {
        timeout: 10000,
        maxRetries: 2
      })
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setUsers(data)
    } catch (error) {
      console.error('[UserManagement] Failed to fetch users:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Caricamento utenti non riuscito', {
        description: errorInfo.userMessage,
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteClick(user: User) {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const res = await fetchWithRetry(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        timeout: 15000,
        maxRetries: 1
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast.success('Utente eliminato', {
        description: data.message,
        duration: 4000
      })

      // Refresh users list
      setUsers(users.filter(u => u.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('[UserManagement] Failed to delete user:', error)
      const errorInfo = analyzeNetworkError(error)
      toast.error('Eliminazione non riuscita', {
        description: errorInfo.userMessage,
        duration: 4000
      })
    } finally {
      setDeleting(false)
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">Admin</span>
      case 'vip':
        return <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-pink-200 to-purple-200 text-purple-900 rounded flex items-center gap-1">
          🎂 VIP 🎉
        </span>
      case 'guest':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Guest</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{role}</span>
    }
  }

  function canDeleteUser(user: User) {
    // Cannot delete admin or VIP users
    return user.role === 'guest'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  const guestUsers = users.filter(u => u.role === 'guest')
  const vipUsers = users.filter(u => u.role === 'vip')
  const adminUsers = users.filter(u => u.role === 'admin')

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-birthday-purple" />
          <h3 className="text-lg font-semibold">Riepilogo Utenti</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{adminUsers.length}</p>
            <p className="text-sm text-gray-600 mt-1">Admin</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg border-2 border-pink-300">
            <p className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-1">
              🎂 {vipUsers.length} 🎉
            </p>
            <p className="text-sm text-gray-700 mt-1 font-semibold">VIP 🐴✨</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{guestUsers.length}</p>
            <p className="text-sm text-gray-600 mt-1">Guest</p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lista Utenti</h3>
            <button
              onClick={fetchUsers}
              className="text-sm text-birthday-purple hover:underline"
            >
              Aggiorna
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nessun utente trovato
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ruolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contenuti
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={user.role === 'vip' ? 'bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {user.role === 'vip' && (
                          <span className="text-lg">🐴🎂🎈</span>
                        )}
                        {user.full_name}
                        {user.role === 'vip' && (
                          <span className="text-lg">🎉✨</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_approved ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Approvato
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          In attesa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.content_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canDeleteUser(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Elimina
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs">Non eliminabile</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Conferma eliminazione utente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>
                  Stai per eliminare l&apos;utente{' '}
                  <span className="font-semibold">{userToDelete?.full_name}</span>.
                </div>
                <div className="text-red-600 font-medium">
                  Questa azione eliminerà:
                </div>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Il profilo utente</li>
                  <li>Tutti i contenuti caricati</li>
                  <li>Tutte le reazioni</li>
                  <li>I file media associati</li>
                </ul>
                <div className="font-semibold mt-4">
                  Questa azione è irreversibile!
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Eliminazione...' : 'Elimina definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
