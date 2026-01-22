'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveUser(userId: string) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non autorizzato')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    throw new Error('Non autorizzato')
  }

  // Approve user
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_approved: true })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/approve-users')
}

export async function rejectUser(userId: string) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non autorizzato')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    throw new Error('Non autorizzato')
  }

  // Delete user (this will cascade delete profile)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/approve-users')
}
