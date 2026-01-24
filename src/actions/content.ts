'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ContentInsert, ContentUpdate } from '@/lib/supabase/types'
import { insertContent, updateContent, selectProfileById, selectFullProfileById, getUserContentCount } from '@/lib/supabase/queries'
import { sendContentNotification, sendApprovalNotification } from '@/lib/email'
import { validateImageMetadata, validateVideoMetadata } from '@/lib/media-validation'

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
    const { data: insertedContent, error } = await insertContent(supabase, contentData)

    if (error || !insertedContent) {
      console.error('Error inserting text content:', error)
      return { success: false, error: 'Errore durante il salvataggio' }
    }

    // Send email notification to admin (non-blocking)
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      console.log('[UPLOAD] Invio email notifica admin...')
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'text',
        contentPreview: textContent,
        contentId: insertedContent.id,
      })
    }

    // Get user content count for feedback message
    const { count } = await getUserContentCount(supabase, user.id)
    const contentCount = count || 0

    revalidatePath('/guest/upload')
    return { success: true, contentCount }
  } catch (error) {
    console.error('Upload text error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

// New: Save image content record (client uploads file directly to Supabase Storage)
export async function saveImageContentRecord(mediaUrl: string) {
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

    if (!mediaUrl) {
      return { success: false, error: 'URL del file mancante' }
    }

    // SERVER-SIDE VALIDATION: Verify file metadata and permissions
    console.log('[Image Upload] Validating file metadata...')
    const validation = await validateImageMetadata(mediaUrl, user.id)

    if (!validation.valid) {
      console.error('[Image Upload] Validation failed:', validation.error)
      return { success: false, error: validation.error || 'File non valido' }
    }

    console.log('[Image Upload] Validation passed:', validation.metadata)

    // Insert content record
    const imageData: ContentInsert = {
      user_id: user.id,
      type: 'image',
      media_url: mediaUrl,
      status: 'pending',
    }
    console.log('[Image Upload] Inserting content record...')
    const { data: insertedContent, error: insertError } = await insertContent(supabase, imageData)

    if (insertError || !insertedContent) {
      console.error('[Image Upload] Database insert error:', insertError)
      return { success: false, error: 'Errore durante il salvataggio' }
    }
    console.log('[Image Upload] Content record inserted successfully')

    // Send email notification to admin (non-blocking)
    console.log('[UPLOAD] Invio email notifica admin...')
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'image',
        contentId: insertedContent.id,
      })
    }
    console.log('[Image Upload] Email notification completed')

    // Get user content count for feedback message
    const { count } = await getUserContentCount(supabase, user.id)
    const contentCount = count || 0

    revalidatePath('/guest/upload')
    console.log('[Image Upload] Upload completed successfully!')
    return { success: true, contentCount }
  } catch (error) {
    console.error('[Image Upload] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore del server'
    return { success: false, error: errorMessage }
  }
}

// Deprecated: Use saveImageContentRecord instead (kept for backward compatibility)
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
    const { data: insertedContent, error: insertError } = await insertContent(supabase, imageData)

    if (insertError || !insertedContent) {
      console.error('[Image Upload] Database insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('content-media').remove([fileName])
      return { success: false, error: 'Errore durante il salvataggio' }
    }
    console.log('[Image Upload] Content record inserted successfully')

    // Send email notification to admin (non-blocking)
    console.log('[UPLOAD] Invio email notifica admin...')
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'image',
        contentId: insertedContent.id,
      })
    }
    console.log('[Image Upload] Email notification completed')

    // Get user content count for feedback message
    const { count } = await getUserContentCount(supabase, user.id)
    const contentCount = count || 0

    revalidatePath('/guest/upload')
    console.log('[Image Upload] Upload completed successfully!')
    return { success: true, contentCount }
  } catch (error) {
    console.error('[Image Upload] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore del server'
    return { success: false, error: errorMessage }
  }
}

// New: Save video content record (client uploads file directly to Supabase Storage)
export async function saveVideoContentRecord(mediaUrl: string) {
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

    if (!mediaUrl) {
      return { success: false, error: 'URL del file mancante' }
    }

    // SERVER-SIDE VALIDATION: Verify file metadata and permissions
    console.log('[Video Upload] Validating file metadata...')
    const validation = await validateVideoMetadata(mediaUrl, user.id)

    if (!validation.valid) {
      console.error('[Video Upload] Validation failed:', validation.error)
      return { success: false, error: validation.error || 'File non valido' }
    }

    console.log('[Video Upload] Validation passed:', validation.metadata)

    // Insert content record
    const videoData: ContentInsert = {
      user_id: user.id,
      type: 'video',
      media_url: mediaUrl,
      status: 'pending',
    }
    console.log('[Video Upload] Inserting content record...')
    const { data: insertedContent, error: insertError } = await insertContent(supabase, videoData)

    if (insertError || !insertedContent) {
      console.error('[Video Upload] Database insert error:', insertError)
      return { success: false, error: 'Errore durante il salvataggio' }
    }
    console.log('[Video Upload] Content record inserted successfully')

    // Send email notification to admin (non-blocking)
    console.log('[UPLOAD] Invio email notifica admin...')
    const { data: profile } = await selectFullProfileById(supabase, user.id)
    if (profile) {
      await sendContentNotification({
        userName: profile.full_name,
        userEmail: profile.email,
        contentType: 'video',
        contentId: insertedContent.id,
      })
    }
    console.log('[Video Upload] Email notification completed')

    // Get user content count for feedback message
    const { count } = await getUserContentCount(supabase, user.id)
    const contentCount = count || 0

    revalidatePath('/guest/upload')
    console.log('[Video Upload] Upload completed successfully!')
    return { success: true, contentCount }
  } catch (error) {
    console.error('[Video Upload] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore del server'
    return { success: false, error: errorMessage }
  }
}

// Deprecated: Use saveVideoContentRecord instead (kept for backward compatibility)
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
    const { error: uploadError } = await supabase.storage
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
    const { data: insertedContent, error: insertError } = await insertContent(supabase, videoData)

    if (insertError || !insertedContent) {
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
        contentId: insertedContent.id,
      })
    }

    // Get user content count for feedback message
    const { count } = await getUserContentCount(supabase, user.id)
    const contentCount = count || 0

    revalidatePath('/guest/upload')
    return { success: true, contentCount }
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

    // Fetch content info with author details before updating
    const { data: contentData } = await supabase
      .from('content')
      .select(`
        id,
        type,
        text_content,
        user_id,
        profiles (
          full_name,
          email
        )
      `)
      .eq('id', contentId)
      .single() as { data: {
        id: string
        type: 'text' | 'image' | 'video'
        text_content: string | null
        user_id: string
        profiles: {
          full_name: string | null
          email: string | null
        } | null
      } | null }

    if (!contentData) {
      return { success: false, error: 'Contenuto non trovato' }
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

    // Send email notification to content author (non-blocking)
    if (contentData.profiles?.email && contentData.profiles?.full_name) {
      console.log('[APPROVAL] Invio email conferma utente...')
      await sendApprovalNotification({
        userName: contentData.profiles.full_name,
        userEmail: contentData.profiles.email,
        contentType: contentData.type,
        contentPreview: contentData.text_content || undefined,
      })
    }

    revalidatePath('/admin/approve-content')
    revalidatePath('/gallery')
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
    const isOwner = content.user_id === user.id

    if (!isAdmin && !isOwner) {
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

export async function bulkApproveContent(contentIds: string[]) {
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

    if (!contentIds || contentIds.length === 0) {
      return { success: false, error: 'Nessun contenuto selezionato' }
    }

    // Fetch all content info with author details before updating
    const { data: contentDataArray } = await supabase
      .from('content')
      .select(`
        id,
        type,
        text_content,
        user_id,
        profiles (
          full_name,
          email
        )
      `)
      .in('id', contentIds)
      .eq('status', 'pending') as { data: Array<{
        id: string
        type: 'text' | 'image' | 'video'
        text_content: string | null
        user_id: string
        profiles: {
          full_name: string | null
          email: string | null
        } | null
      }> | null }

    if (!contentDataArray || contentDataArray.length === 0) {
      return { success: false, error: 'Nessun contenuto pending trovato' }
    }

    const approvedAt = new Date().toISOString()

    // Update all content status in bulk
    // @ts-ignore - Supabase type inference issue with update chaining
    const result = await (supabase as any)
      .from('content')
      .update({
        status: 'approved',
        approved_at: approvedAt,
      })
      .in('id', contentIds)
      .eq('status', 'pending')

    const { error } = result

    if (error) {
      console.error('Error bulk approving content:', error)
      return { success: false, error: 'Errore durante l\'approvazione' }
    }

    // Send email notifications to content authors (non-blocking)
    for (const contentData of contentDataArray) {
      if (contentData.profiles?.email && contentData.profiles?.full_name) {
        await sendApprovalNotification({
          userName: contentData.profiles.full_name,
          userEmail: contentData.profiles.email,
          contentType: contentData.type,
          contentPreview: contentData.text_content || undefined,
        }).catch((err) => {
          console.error('Error sending approval email:', err)
        })
      }
    }

    revalidatePath('/admin/approve-content')
    revalidatePath('/gallery')
    return { success: true, count: contentDataArray.length }
  } catch (error) {
    console.error('Bulk approve content error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function bulkRejectContent(contentIds: string[]) {
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

    if (!contentIds || contentIds.length === 0) {
      return { success: false, error: 'Nessun contenuto selezionato' }
    }

    // Update all content status in bulk
    // @ts-ignore - Supabase type inference issue with update chaining
    const result = await (supabase as any)
      .from('content')
      .update({
        status: 'rejected',
      })
      .in('id', contentIds)
      .eq('status', 'pending')

    const { error } = result

    if (error) {
      console.error('Error bulk rejecting content:', error)
      return { success: false, error: 'Errore durante il rifiuto' }
    }

    revalidatePath('/admin/approve-content')
    return { success: true, count: contentIds.length }
  } catch (error) {
    console.error('Bulk reject content error:', error)
    return { success: false, error: 'Errore del server' }
  }
}
