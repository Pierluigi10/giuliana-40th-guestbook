import { createClient } from '@/lib/supabase/server'

export interface CleanupResult {
  cleaned: number
  errors: string[]
}

/**
 * Pulisce contenuti rejected più vecchi di N giorni
 * Elimina sia i file da storage che i record dal database
 */
export async function cleanupRejectedContent(daysOld: number = 7): Promise<CleanupResult> {
  const errors: string[] = []
  let cleaned = 0

  try {
    const supabase = await createClient()

    // Calcola data limite
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - daysOld)

    // Trova contenuti rejected più vecchi di N giorni
    const { data: rejectedContent, error: fetchError } = await supabase
      .from('content')
      .select('id, media_url')
      .eq('status', 'rejected')
      .lt('created_at', limitDate.toISOString())
      .returns<Array<{ id: string; media_url: string | null }>>()

    if (fetchError) {
      errors.push(`Failed to fetch rejected content: ${fetchError.message}`)
      return { cleaned, errors }
    }

    if (!rejectedContent || rejectedContent.length === 0) {
      return { cleaned: 0, errors: [] }
    }

    // Elimina file da storage
    for (const content of rejectedContent) {
      if (content.media_url) {
        try {
          const fileName = content.media_url.split('/').pop()
          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from('content-media')
              .remove([fileName])

            if (storageError) {
              errors.push(`Failed to delete file ${fileName}: ${storageError.message}`)
            }
          }
        } catch (error) {
          errors.push(`Error processing file for content ${content.id}: ${error}`)
        }
      }
    }

    // Elimina record dal database
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .in('id', rejectedContent.map(c => c.id))

    if (deleteError) {
      errors.push(`Failed to delete database records: ${deleteError.message}`)
      return { cleaned, errors }
    }

    cleaned = rejectedContent.length
    return { cleaned, errors }
  } catch (error) {
    errors.push(`Unexpected error during cleanup: ${error}`)
    return { cleaned, errors }
  }
}

/**
 * Restituisce statistiche sui contenuti rejected
 */
export async function getRejectedContentStats() {
  try {
    const supabase = await createClient()

    // Conta contenuti rejected
    const { count: totalRejected } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')

    // Conta contenuti rejected più vecchi di 7 giorni
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: oldRejected } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .lt('created_at', sevenDaysAgo.toISOString())

    return {
      totalRejected: totalRejected || 0,
      oldRejected: oldRejected || 0,
    }
  } catch (error) {
    console.error('Failed to get rejected content stats:', error)
    return null
  }
}
