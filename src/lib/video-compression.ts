import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null

/**
 * Inizializza FFmpeg.wasm (lazy loading)
 */
export async function initFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance

  ffmpegInstance = new FFmpeg()
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  return ffmpegInstance
}

interface CompressionOptions {
  quality?: 'low' | 'medium' | 'high'
  onProgress?: (progress: number) => void
}

/**
 * Comprimi video usando FFmpeg.wasm
 * @param file - Video file da comprimere
 * @param options - Opzioni compressione
 * @returns File compresso (MP4)
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { quality = 'medium', onProgress } = options

  const ffmpeg = await initFFmpeg()

  // Write input file to virtual filesystem
  await ffmpeg.writeFile('input.mp4', await fetchFile(file))

  // Quality settings: CRF (0-51, lower = better quality)
  const qualitySettings = {
    low: { crf: 32, preset: 'veryfast' },     // ~70% size reduction, fast
    medium: { crf: 28, preset: 'medium' },     // ~60% size reduction, balanced
    high: { crf: 23, preset: 'slow' },         // ~50% size reduction, slow
  }

  const { crf, preset } = qualitySettings[quality]

  // Progress listener
  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  // Compress video with H.264
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-c:v', 'libx264',           // Video codec
    '-crf', crf.toString(),      // Quality (lower = better)
    '-preset', preset,           // Speed/quality tradeoff
    '-c:a', 'aac',               // Audio codec
    '-b:a', '128k',              // Audio bitrate
    '-movflags', '+faststart',   // Enable streaming
    'output.mp4'
  ])

  // Read compressed file
  const data = await ffmpeg.readFile('output.mp4')
  // Convert FileData to Uint8Array for Blob compatibility
  const uint8Data = new Uint8Array(data as unknown as ArrayBuffer)
  const compressedBlob = new Blob([uint8Data], { type: 'video/mp4' })

  // Cleanup virtual filesystem
  await ffmpeg.deleteFile('input.mp4')
  await ffmpeg.deleteFile('output.mp4')

  // Create File object with original name (force .mp4)
  const compressedFile = new File(
    [compressedBlob],
    file.name.replace(/\.[^.]+$/, '.mp4'),
    { type: 'video/mp4' }
  )

  console.log(`[Video Compression] ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

  return compressedFile
}
