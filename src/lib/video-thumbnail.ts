import { fetchFile } from '@ffmpeg/util'
import { initFFmpeg, isFFmpegLoaded } from './video-compression'

/**
 * Options for video thumbnail generation
 */
interface ThumbnailOptions {
  /** Time in video to extract frame from (seconds). Default: 1 */
  seekTime?: number
  /** Thumbnail width in pixels. Default: 800 */
  width?: number
  /** JPEG quality (1-31, lower = better). Default: 2 */
  quality?: number
}

/**
 * Generate JPEG thumbnail from video using FFmpeg.wasm
 *
 * This function extracts a single frame from the video and saves it as a JPEG image
 * optimized for use as a thumbnail in the gallery.
 *
 * @param videoFile - Video file to extract frame from
 * @param options - Options to customize the thumbnail
 * @returns Promise with JPEG thumbnail File (~50-100KB)
 *
 * @throws Error if FFmpeg fails or if the video is corrupted
 *
 * @example
 * ```ts
 * const thumbnail = await generateVideoThumbnail(videoFile, {
 *   seekTime: 1,    // Frame at 1 second
 *   width: 800,     // 800px width
 *   quality: 2      // High quality
 * })
 * ```
 */
export async function generateVideoThumbnail(
  videoFile: File,
  options: ThumbnailOptions = {}
): Promise<File> {
  const {
    seekTime = 1,       // Avoid initial black frames
    width = 800,        // Optimal for gallery cards
    quality = 2,        // Best quality (scale 1-31, lower = better)
  } = options

  try {
    // Get FFmpeg instance (reuse existing if already loaded)
    const ffmpeg = await initFFmpeg()

    // Temporary file names in FFmpeg virtual filesystem
    const inputName = 'video_input.mp4'
    const outputName = 'thumbnail_output.jpg'

    // Write video to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

    // Extract frame as JPEG thumbnail
    // FFmpeg command: seek to N seconds, extract 1 frame, scale to width px, quality 2
    await ffmpeg.exec([
      '-ss', seekTime.toString(),          // Seek to N seconds in video
      '-i', inputName,                     // Input video
      '-vframes', '1',                     // Extract only 1 frame
      '-vf', `scale=${width}:-1`,         // Scale to width px, maintain aspect ratio
      '-q:v', quality.toString(),          // JPEG quality (2 = excellent)
      outputName,
    ])

    // Read generated thumbnail from virtual filesystem
    const thumbnailData = await ffmpeg.readFile(outputName)
    // Convert FileData to Uint8Array for Blob compatibility
    const uint8Data = new Uint8Array(thumbnailData as unknown as ArrayBuffer)
    const thumbnailBlob = new Blob([uint8Data], { type: 'image/jpeg' })

    // Cleanup virtual filesystem (free memory)
    try {
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
    } catch (cleanupError) {
      // Non-blocking cleanup error
      console.warn('[Video Thumbnail] Cleanup warning:', cleanupError)
    }

    // Create File object with name derived from original video
    const originalName = videoFile.name.replace(/\.[^.]+$/, '')
    const thumbnailFile = new File(
      [thumbnailBlob],
      `${originalName}_thumb.jpg`,
      { type: 'image/jpeg' }
    )

    console.log(
      `[Video Thumbnail] Generated: ${thumbnailFile.size} bytes from ${videoFile.name}`
    )

    return thumbnailFile
  } catch (error) {
    // Log error for debugging but rethrow for upstream handling
    console.error('[Video Thumbnail] Generation failed:', error)
    throw new Error(
      `Failed to generate video thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Preload FFmpeg in background (optional)
 * Useful to load FFmpeg before the user starts uploading
 */
export async function preloadFFmpeg(): Promise<void> {
  try {
    await initFFmpeg()
    console.log('[Video Thumbnail] FFmpeg preloaded successfully')
  } catch (error) {
    console.warn('[Video Thumbnail] FFmpeg preload failed:', error)
  }
}

// Re-export isFFmpegLoaded for public API
export { isFFmpegLoaded }
