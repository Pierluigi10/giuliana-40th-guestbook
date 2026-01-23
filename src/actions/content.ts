'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ContentInsert, ContentUpdate } from '@/lib/supabase/types'
import { insertContent, updateContent, selectProfileById } from '@/lib/supabase/queries'

export async function uploadTextContent(textContent: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
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

    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'Nessun file selezionato' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Il file deve essere un\'immagine' }
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
      console.error('Error uploading image:', uploadError)
      return { success: false, error: 'Errore durante il caricamento del file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(fileName)

    // Insert content record
    const imageData: ContentInsert = {
      user_id: user.id,
      type: 'image',
      media_url: publicUrl,
      status: 'pending',
    }
    const { error: insertError } = await insertContent(supabase, imageData)

    if (insertError) {
      console.error('Error inserting image content:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('content-media').remove([fileName])
      return { success: false, error: 'Errore durante il salvataggio' }
    }

    revalidatePath('/guest/upload')
    return { success: true }
  } catch (error) {
    console.error('Upload image error:', error)
    return { success: false, error: 'Errore del server' }
  }
}

export async function uploadVideoContent(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Non autenticato' }
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
