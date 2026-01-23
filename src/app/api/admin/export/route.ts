import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllApprovedContent, createContentZip, createTextContentPDF } from '@/lib/export-content'
import { selectProfileById } from '@/lib/supabase/queries'

/**
 * API route for exporting content
 * GET /api/admin/export?format=zip|pdf
 * 
 * Only accessible by admin users
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await selectProfileById(supabase, user.id)
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get export format from query params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'zip'

    if (format !== 'zip' && format !== 'pdf') {
      return NextResponse.json({ error: 'Invalid format. Use "zip" or "pdf"' }, { status: 400 })
    }

    // Fetch all approved content
    const { data: content, error: contentError } = await getAllApprovedContent(supabase)

    if (contentError) {
      console.error('Error fetching content:', contentError)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    if (!content || content.length === 0) {
      return NextResponse.json({ error: 'No approved content to export' }, { status: 404 })
    }

    // Generate export file
    let buffer: Buffer
    let filename: string
    let contentType: string

    if (format === 'zip') {
      buffer = await createContentZip(supabase, content)
      filename = `guestbook-export-${new Date().toISOString().split('T')[0]}.zip`
      contentType = 'application/zip'
    } else {
      buffer = await createTextContentPDF(content)
      filename = `guestbook-messages-${new Date().toISOString().split('T')[0]}.pdf`
      contentType = 'application/pdf'
    }

    // Return file as download
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error during export' },
      { status: 500 }
    )
  }
}
