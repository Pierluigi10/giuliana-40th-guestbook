#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixStoragePublic() {
  console.log('🔧 Updating content-media bucket to be public...\n')

  try {
    // Update bucket to be public using the REST API
    const { data, error } = await supabase.storage.updateBucket('content-media', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/webm'
      ]
    })

    if (error) {
      console.error('❌ Error updating bucket:', error.message)
      console.log('\n📝 Alternative: Run this SQL in Supabase SQL Editor:')
      console.log(`
UPDATE storage.buckets
SET public = true
WHERE id = 'content-media';
`)
      return
    }

    console.log('✅ Bucket updated successfully!')
    console.log('   The bucket is now PUBLIC')
    console.log()

    // Verify the change
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucket = buckets.find(b => b.id === 'content-media')

    if (bucket?.public) {
      console.log('✅ Verified: Bucket is now public')
      console.log()
      console.log('🎉 Images should now load correctly!')
      console.log('   Try uploading a new image to test.')
    } else {
      console.error('⚠️  Verification failed - bucket still not public')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

fixStoragePublic()
