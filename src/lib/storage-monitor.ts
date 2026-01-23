import { createClient } from '@/lib/supabase/server'

export interface StorageStats {
  totalBytes: number
  totalMB: number
  limitMB: number
  percentageUsed: number
  fileCount: number
  filesByType: {
    images: number
    videos: number
  }
  largestFiles: Array<{
    name: string
    size: number
    sizeMB: number
    type: string
  }>
}

export async function getStorageStats(): Promise<StorageStats | null> {
  try {
    const supabase = await createClient()

    // List all files in content-media bucket
    const { data: files, error } = await supabase
      .storage
      .from('content-media')
      .list('', {
        limit: 1000, // Fetch up to 1000 files
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error || !files) {
      console.error('Error fetching storage stats:', error)
      return null
    }

    // Calculate totals
    let totalBytes = 0
    let imageCount = 0
    let videoCount = 0
    const largestFiles: StorageStats['largestFiles'] = []

    for (const file of files) {
      totalBytes += file.metadata?.size || 0

      // Count by type
      const isImage = file.metadata?.mimetype?.startsWith('image/')
      const isVideo = file.metadata?.mimetype?.startsWith('video/')

      if (isImage) imageCount++
      if (isVideo) videoCount++

      // Track largest files
      largestFiles.push({
        name: file.name,
        size: file.metadata?.size || 0,
        sizeMB: (file.metadata?.size || 0) / 1024 / 1024,
        type: file.metadata?.mimetype || 'unknown'
      })
    }

    // Sort by size descending
    largestFiles.sort((a, b) => b.size - a.size)

    const totalMB = totalBytes / 1024 / 1024
    const limitMB = 500 // Supabase free tier
    const percentageUsed = (totalMB / limitMB) * 100

    return {
      totalBytes,
      totalMB: parseFloat(totalMB.toFixed(2)),
      limitMB,
      percentageUsed: parseFloat(percentageUsed.toFixed(2)),
      fileCount: files.length,
      filesByType: {
        images: imageCount,
        videos: videoCount
      },
      largestFiles: largestFiles.slice(0, 10) // Top 10 largest files
    }
  } catch (error) {
    console.error('Failed to get storage stats:', error)
    return null
  }
}
