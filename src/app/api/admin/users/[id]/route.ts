import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProfileRow } from '@/lib/supabase/types'

/**
 * DELETE /api/admin/users/[id]
 * Deletes a user and all associated content
 * Only accessible by admin role
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: userIdToDelete } = await params

    // Verify that user is admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Pick<ProfileRow, 'role'>>()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (user.id === userIdToDelete) {
      return NextResponse.json({
        error: 'Non puoi eliminare il tuo account admin'
      }, { status: 400 })
    }

    // Check if user exists and get their role
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', userIdToDelete)
      .single<Pick<ProfileRow, 'role' | 'full_name'>>()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Prevent deletion of admin users
    if (targetUser.role === 'admin') {
      return NextResponse.json({
        error: 'Non puoi eliminare altri utenti admin'
      }, { status: 400 })
    }

    // Prevent deletion of VIP user
    if (targetUser.role === 'vip') {
      return NextResponse.json({
        error: 'Non puoi eliminare l\'utente VIP'
      }, { status: 400 })
    }

    // Delete user's reactions first (foreign key constraint)
    const { error: reactionsError } = await supabase
      .from('reactions')
      .delete()
      .eq('user_id', userIdToDelete)

    if (reactionsError) {
      console.error('Error deleting user reactions:', reactionsError)
      return NextResponse.json({
        error: 'Errore durante l\'eliminazione delle reazioni'
      }, { status: 500 })
    }

    // Get user's content to delete associated media files
    const { data: userContent, error: contentFetchError } = await supabase
      .from('content')
      .select('media_url')
      .eq('user_id', userIdToDelete) as { data: Array<{ media_url: string | null }> | null; error: any }

    if (contentFetchError) {
      console.error('Error fetching user content:', contentFetchError)
      return NextResponse.json({
        error: 'Errore durante il recupero dei contenuti'
      }, { status: 500 })
    }

    // Delete media files from storage
    if (userContent && userContent.length > 0) {
      const mediaUrls = userContent
        .filter(content => content.media_url)
        .map(content => content.media_url as string)

      for (const mediaUrl of mediaUrls) {
        try {
          // Extract file path from URL
          const urlParts = mediaUrl.split('/uploads/')
          if (urlParts.length === 2) {
            const filePath = urlParts[1]
            await supabase.storage.from('uploads').remove([filePath])
          }
        } catch (error) {
          console.error('Error deleting media file:', error)
          // Continue even if media deletion fails
        }
      }
    }

    // Delete user's content
    const { error: contentError } = await supabase
      .from('content')
      .delete()
      .eq('user_id', userIdToDelete)

    if (contentError) {
      console.error('Error deleting user content:', contentError)
      return NextResponse.json({
        error: 'Errore durante l\'eliminazione dei contenuti'
      }, { status: 500 })
    }

    // Delete user profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete)

    if (deleteError) {
      console.error('Error deleting user profile:', deleteError)
      return NextResponse.json({
        error: 'Errore durante l\'eliminazione del profilo'
      }, { status: 500 })
    }

    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(
      userIdToDelete
    )

    if (authError) {
      console.error('Error deleting user from auth:', authError)
      // Profile is already deleted, log but don't fail
      return NextResponse.json({
        success: true,
        message: 'Utente eliminato parzialmente (profilo rimosso, auth fallito)',
        warning: 'Richiede intervento manuale per rimuovere l\'autenticazione'
      })
    }

    return NextResponse.json({
      success: true,
      message: `Utente ${targetUser.full_name} eliminato con successo`
    })
  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json({
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}
