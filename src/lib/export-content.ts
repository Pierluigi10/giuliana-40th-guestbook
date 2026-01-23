import archiver from 'archiver'
import PDFDocument from 'pdfkit'
import type { TypedSupabaseClient } from './supabase/types'

/**
 * Export all approved content for backup and preservation
 * Supports ZIP (all content) and PDF (text messages only)
 */

export interface ExportContent {
  id: string
  type: 'text' | 'image' | 'video'
  text_content: string | null
  media_url: string | null
  created_at: string
  approved_at: string | null
  user_id: string
  author_name: string | null
  author_email: string | null
}

/**
 * Fetch all approved content with author information
 */
export async function getAllApprovedContent(
  supabase: TypedSupabaseClient
): Promise<{ data: ExportContent[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('content')
      .select(`
        id,
        type,
        text_content,
        media_url,
        created_at,
        approved_at,
        user_id,
        profiles (
          full_name,
          email
        )
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })

    if (error) {
      return { data: null, error }
    }

    const exportContent: ExportContent[] = (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      text_content: item.text_content,
      media_url: item.media_url,
      created_at: item.created_at,
      approved_at: item.approved_at,
      user_id: item.user_id,
      author_name: (item.profiles as any)?.full_name || null,
      author_email: (item.profiles as any)?.email || null,
    }))

    return { data: exportContent, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Download a file from Supabase Storage and return as Buffer
 */
async function downloadFileFromStorage(
  supabase: TypedSupabaseClient,
  mediaUrl: string
): Promise<Buffer | null> {
  try {
    // Extract path from URL
    // URL formats:
    // - https://[project].supabase.co/storage/v1/object/public/content-media/[path]
    // - https://[project].supabase.co/storage/v1/object/sign/content-media/[path]?token=...
    let filePath: string | null = null

    // Try to extract path from public URL
    const publicUrlMatch = mediaUrl.match(/\/content-media\/(.+)$/)
    if (publicUrlMatch) {
      filePath = decodeURIComponent(publicUrlMatch[1].split('?')[0]) // Remove query params
    }

    // If no path found, try signed URL format
    if (!filePath) {
      const signedUrlMatch = mediaUrl.match(/\/content-media\/(.+?)(\?|$)/)
      if (signedUrlMatch) {
        filePath = decodeURIComponent(signedUrlMatch[1])
      }
    }

    if (!filePath) {
      console.error('Could not extract file path from URL:', mediaUrl)
      return null
    }

    // Try direct download first
    const { data, error } = await supabase.storage
      .from('content-media')
      .download(filePath)

    if (error || !data) {
      // If direct download fails, try fetching via HTTP
      console.warn('Direct download failed, trying HTTP fetch:', error?.message)
      try {
        const response = await fetch(mediaUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      } catch (fetchError) {
        console.error('HTTP fetch also failed:', fetchError)
        return null
      }
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error in downloadFileFromStorage:', error)
    return null
  }
}

/**
 * Create a ZIP archive with all content (text, images, videos)
 */
export async function createContentZip(
  supabase: TypedSupabaseClient,
  content: ExportContent[]
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    archive.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    archive.on('error', (err) => {
      reject(err)
    })

    // Create index file with all content metadata
    const indexContent = content
      .map((item, index) => {
        const date = item.approved_at || item.created_at
        return `${index + 1}. ${item.type.toUpperCase()} - ${item.author_name || 'Unknown'} (${new Date(date).toLocaleDateString('it-IT')})
   ID: ${item.id}
   Author: ${item.author_name || 'Unknown'} (${item.author_email || 'N/A'})
   Created: ${new Date(item.created_at).toLocaleString('it-IT')}
   Approved: ${item.approved_at ? new Date(item.approved_at).toLocaleString('it-IT') : 'N/A'}
   ${item.type === 'text' ? `Text: ${item.text_content?.substring(0, 100)}...` : `File: ${item.media_url?.split('/').pop() || 'N/A'}`}
`
      })
      .join('\n---\n\n')

    archive.append(indexContent, { name: 'INDEX.txt' })

    // Add text content as individual files
    const textContent = content.filter((item) => item.type === 'text')
    for (const item of textContent) {
      const fileName = `text/${item.id}_${item.author_name?.replace(/[^a-z0-9]/gi, '_') || 'unknown'}.txt`
      const fileContent = `Author: ${item.author_name || 'Unknown'}
Email: ${item.author_email || 'N/A'}
Created: ${new Date(item.created_at).toLocaleString('it-IT')}
Approved: ${item.approved_at ? new Date(item.approved_at).toLocaleString('it-IT') : 'N/A'}

${item.text_content || ''}
`
      archive.append(fileContent, { name: fileName })
    }

    // Download and add media files (images and videos)
    const mediaContent = content.filter((item) => item.type === 'image' || item.type === 'video')
    
    for (const item of mediaContent) {
      if (!item.media_url) continue

      try {
        const fileBuffer = await downloadFileFromStorage(supabase, item.media_url)
        if (fileBuffer) {
          const urlParts = item.media_url.split('/')
          const originalFileName = urlParts[urlParts.length - 1]
          const extension = originalFileName.split('.').pop() || (item.type === 'image' ? 'jpg' : 'mp4')
          const fileName = `${item.type}s/${item.id}_${item.author_name?.replace(/[^a-z0-9]/gi, '_') || 'unknown'}.${extension}`
          archive.append(fileBuffer, { name: fileName })
        } else {
          // Add placeholder if download fails
          archive.append(`File could not be downloaded: ${item.media_url}`, {
            name: `${item.type}s/${item.id}_ERROR.txt`,
          })
        }
      } catch (error) {
        console.error(`Error adding file ${item.id}:`, error)
        archive.append(`Error downloading file: ${item.media_url}`, {
          name: `${item.type}s/${item.id}_ERROR.txt`,
        })
      }
    }

    // Finalize the archive
    archive.finalize()
  })
}

/**
 * Create a PDF with all text messages
 */
export async function createTextContentPDF(content: ExportContent[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: 'Guestbook Messages - Giuliana 40th Birthday',
        Author: 'Guestbook Export',
        Subject: 'Text messages from friends',
        Creator: 'Guestbook App',
      },
    })

    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    doc.on('error', (err) => {
      reject(err)
    })

    // Title page
    doc.fontSize(24).text('Guestbook Messages', { align: 'center' })
    doc.moveDown()
    doc.fontSize(16).text("Giuliana's 40th Birthday", { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(12).text(`Total Messages: ${content.filter((c) => c.type === 'text').length}`, { align: 'center' })
    doc.fontSize(10).text(`Exported on: ${new Date().toLocaleString('it-IT')}`, { align: 'center' })
    doc.addPage()

    // Add each text message
    const textContent = content.filter((item) => item.type === 'text' && item.text_content)

    if (textContent.length === 0) {
      doc.fontSize(14).text('No text messages available.', { align: 'center' })
      doc.end()
      return
    }

    textContent.forEach((item, index) => {
      if (index > 0) {
        doc.addPage()
      }

      // Author info
      doc.fontSize(14).font('Helvetica-Bold').text(item.author_name || 'Unknown', {
        underline: true,
      })
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica').text(`Email: ${item.author_email || 'N/A'}`)
      doc.fontSize(10).text(`Date: ${new Date(item.created_at).toLocaleString('it-IT')}`)
      if (item.approved_at) {
        doc.fontSize(10).text(`Approved: ${new Date(item.approved_at).toLocaleString('it-IT')}`)
      }
      doc.moveDown()

      // Message content
      doc.fontSize(12).font('Helvetica').text(item.text_content || '', {
        align: 'left',
        continued: false,
      })

      // Add separator line
      doc.moveDown()
      doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown()
    })

    doc.end()
  })
}
