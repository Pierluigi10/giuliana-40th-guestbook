'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ReactionInsert, ReactionRow } from '@/lib/supabase/types'
import { insertReaction, selectProfileById } from '@/lib/supabase/queries'

export async function addReaction(contentId: string, emoji: string): Promise<
  { success: true; reaction?: ReactionRow } | { success: false; error: string }
> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Check if user is VIP or admin
    const { data: profile } = await selectProfileById(supabase, user.id)

    if (!profile || !['vip', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Solo VIP e Admin possono aggiungere reactions' }
    }

    // Add reaction
    const reactionData: ReactionInsert = {
      content_id: contentId,
      user_id: user.id,
      emoji,
    }
    const { data, error } = await insertReaction(supabase, reactionData)

    if (error) {
      // If duplicate, it's ok (unique constraint)
      if (error.code === '23505') {
        return { success: true }
      }
      console.error('Error adding reaction:', error)
      return { success: false, error: 'Errore durante l\'aggiunta della reaction' }
    }

    revalidatePath('/vip/gallery')
    return { success: true, reaction: data as ReactionRow }
  } catch (error) {
    console.error('Add reaction error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function removeReaction(reactionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Delete reaction (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', reactionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing reaction:', error)
      return { success: false, error: 'Errore durante la rimozione della reaction' }
    }

    revalidatePath('/vip/gallery')
    return { success: true }
  } catch (error) {
    console.error('Remove reaction error:', error)
    return { success: false, error: 'Errore del server' }
  }
}
