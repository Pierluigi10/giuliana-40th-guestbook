'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ContentInsert, ContentUpdate } from '@/lib/supabase/types'
import { insertContent, updateContent, selectProfileById, selectFullProfileById } from '@/lib/supabase/queries'
import { sendContentNotification } from '@/lib/email'

export async function uploadTextContent(textContent: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Check rate limit: max 1 upload per minute
    const { data: lastUpload } = await supabase
      .from('content')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { created_at: string } | null }

    if (lastUpload) {
      const elapsed = Date.now() - new Date(lastUpload.created_at).getTime()
      const oneMinute = 60 * 1000

      if (elapsed < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - elapsed) / 1000)
        return {
          success: false,
          error: `Attendi ${remainingSeconds} secondi prima di caricare un altro contenuto`
        }
      }
    }

    // Validate input
    if (textContent.length < 10 || textContent.length > 1000) {
      return { success: false, error: 'Il messaggio deve essere tra 10 e 1000 caratteri' }
    }

    // Insert content
    const contentData: ContentInsert = {
      user_id: user.id,
      type: 'text',
      text_content: textContent,
      status: 'pending',
    }
    const { error } = await insertContent(supabase, contentData)

    if (error) {
      console.error('Error inserting text content:', error)
      return { success: false, error: 'Errore durante il salvataggio' }
    }

    // Send email notification to admin (non-blocking)
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'text',
        contentPreview: textContent,
      })
    }

    revalidatePath('/guest/upload')
    return { success: true }
  } catch (error) {
    console.error('Upload text error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function uploadImageContent(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Check rate limit: max 1 upload per minute
    const { data: lastUpload } = await supabase
      .from('content')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { created_at: string } | null }

    if (lastUpload) {
      const elapsed = Date.now() - new Date(lastUpload.created_at).getTime()
      const oneMinute = 60 * 1000

      if (elapsed < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - elapsed) / 1000)
        return {
          success: false,
          error: `Attendi ${remainingSeconds} secondi prima di caricare un altro contenuto`
        }
      }
    }

    const file = formData.get('file') as File

    console.log('[Image Upload] File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
    })

    if (!file) {
      return { success: false, error: 'Nessun file selezionato' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('[Image Upload] Invalid file type:', file.type)
      return { success: false, error: 'Il file deve essere un\'immagine' }
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('[Image Upload] File too large:', file.size)
      return { success: false, error: 'File troppo grande (max 10MB)' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`
    console.log('[Image Upload] Generated filename:', fileName)

    // Upload to storage
    console.log('[Image Upload] Starting storage upload...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Image Upload] Storage upload error:', uploadError)
      return { success: false, error: 'Errore durante il caricamento del file' }
    }
    console.log('[Image Upload] Storage upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(fileName)
    console.log('[Image Upload] Public URL generated:', publicUrl)

    // Insert content record
    const imageData: ContentInsert = {
      user_id: user.id,
      type: 'image',
      media_url: publicUrl,
      status: 'pending',
    }
    console.log('[Image Upload] Inserting content record...')
    const { error: insertError } = await insertContent(supabase, imageData)

    if (insertError) {
      console.error('[Image Upload] Database insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('content-media').remove([fileName])
      return { success: false, error: 'Errore durante il salvataggio' }
    }
    console.log('[Image Upload] Content record inserted successfully')

    // Send email notification to admin (non-blocking)
    console.log('[Image Upload] Sending email notification...')
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'image',
      })
    }
    console.log('[Image Upload] Email notification completed')

    revalidatePath('/guest/upload')
    console.log('[Image Upload] Upload completed successfully!')
    return { success: true }
  } catch (error) {
    console.error('[Image Upload] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore del server'
    return { success: false, error: errorMessage }
  }
}

export async function uploadVideoContent(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Check rate limit: max 1 upload per minute
    const { data: lastUpload } = await supabase
      .from('content')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { created_at: string } | null }

    if (lastUpload) {
      const elapsed = Date.now() - new Date(lastUpload.created_at).getTime()
      const oneMinute = 60 * 1000

      if (elapsed < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - elapsed) / 1000)
        return {
          success: false,
          error: `Attendi ${remainingSeconds} secondi prima di caricare un altro contenuto`
        }
      }
    }

    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'Nessun file selezionato' }
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return { success: false, error: 'Il file deve essere un video' }
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File troppo grande (max 10MB)' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading video:', uploadError)
      return { success: false, error: 'Errore durante il caricamento del file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(fileName)

    // Insert content record
    const videoData: ContentInsert = {
      user_id: user.id,
      type: 'video',
      media_url: publicUrl,
      status: 'pending',
    }
    const { error: insertError } = await insertContent(supabase, videoData)

    if (insertError) {
      console.error('Error inserting video content:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('content-media').remove([fileName])
      return { success: false, error: 'Errore durante il salvataggio' }
    }

    // Send email notification to admin (non-blocking)
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'video',
      })
    }

    revalidatePath('/guest/upload')
    return { success: true }
  } catch (error) {
    console.error('Upload video error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function approveContent(contentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Check if user is admin
    const { data: profile } = await selectProfileById(supabase, user.id)

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Permesso negato' }
    }

    // Update content status
    const updateData: ContentUpdate = {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }
    const { error } = await updateContent(supabase, contentId, updateData)

    if (error) {
      console.error('Error approving content:', error)
      return { success: false, error: 'Errore durante l\'approvazione' }
    }

    revalidatePath('/admin/approve-content')
    return { success: true }
  } catch (error) {
    console.error('Approve content error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function rejectContent(contentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Check if user is admin
    const { data: profile } = await selectProfileById(supabase, user.id)

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Permesso negato' }
    }

    // Update content status
    const rejectData: ContentUpdate = {
      status: 'rejected',
    }
    const { error } = await updateContent(supabase, contentId, rejectData)

    if (error) {
      console.error('Error rejecting content:', error)
      return { success: false, error: 'Errore durante il rifiuto' }
    }

    revalidatePath('/admin/approve-content')
    return { success: true }
  } catch (error) {
    console.error('Reject content error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function deleteContent(contentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
    }

    // Get content info to check ownership and delete associated media
    const { data: content } = await supabase
      .from('content')
      .select('user_id, media_url, type')
      .eq('id', contentId)
      .single() as { data: { user_id: string; media_url: string | null; type: string } | null }

    if (!content) {
      return { success: false, error: 'Contenuto non trovato' }
    }

    // Check if user has permission to delete
    const { data: profile } = await selectProfileById(supabase, user.id)
    const isAdmin = profile?.role === 'admin'
    const isVip = profile?.role === 'vip'
    const isOwner = content.user_id === user.id

    if (!isAdmin && !isVip && !isOwner) {
      return { success: false, error: 'Non hai il permesso di eliminare questo contenuto' }
    }

    // Delete media file from storage if exists
    if (content?.media_url && (content.type === 'image' || content.type === 'video')) {
      const url = new URL(content.media_url)
      const pathParts = url.pathname.split('/storage/v1/object/public/content-media/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        await supabase.storage.from('content-media').remove([filePath])
      }
    }

    // Delete content record (RLS policy will enforce permissions at DB level)
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', contentId)

    if (error) {
      console.error('Error deleting content:', error)
      return { success: false, error: 'Errore durante l\'eliminazione' }
    }

    revalidatePath('/gallery')
    revalidatePath('/admin/approve-content')
    return { success: true }
  } catch (error) {
    console.error('Delete content error:', error)
    return { success: false, error: 'Errore del server' }
  }
}
