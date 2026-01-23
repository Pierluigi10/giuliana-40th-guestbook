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
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkStorage() {
  console.log('🔍 Checking storage bucket configuration...\n')

  try {
    // Check if content-media bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message)
      return
    }

    console.log('📦 Available buckets:')
    buckets.forEach((bucket) => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`)
    })
    console.log()

    const contentMediaBucket = buckets.find((b) => b.id === 'content-media')

    if (!contentMediaBucket) {
      console.log('⚠️  Bucket "content-media" not found!')
      console.log('📝 You need to run migration 005_storage_bucket_and_policies.sql')
      console.log()
      console.log('Run this command in Supabase SQL Editor:')
      console.log('   Copy content from: supabase/migrations/005_storage_bucket_and_policies.sql')
      return
    }

    console.log('✅ Bucket "content-media" found')
    console.log(`   Public: ${contentMediaBucket.public}`)
    console.log(`   File size limit: ${contentMediaBucket.file_size_limit ? (contentMediaBucket.file_size_limit / 1024 / 1024).toFixed(2) + ' MB' : 'Not set'}`)
    console.log(`   Allowed MIME types: ${contentMediaBucket.allowed_mime_types?.join(', ') || 'All'}`)
    console.log()

    // Test uploading a dummy file
    console.log('🧪 Testing file upload...')

    const testFileName = `test-${Date.now()}.txt`
    const testFile = new Blob(['Test file from check-storage script'], { type: 'text/plain' })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(`test/${testFileName}`, testFile)

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
      console.log('\nPossible issues:')
      console.log('   - RLS policies not configured correctly')
      console.log('   - Service role key not working')
      return
    }

    console.log('✅ Upload test successful')
    console.log(`   Path: ${uploadData.path}`)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(uploadData.path)

    console.log(`   Public URL: ${publicUrl}`)
    console.log()

    // Clean up test file
    console.log('🧹 Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from('content-media')
      .remove([uploadData.path])

    if (deleteError) {
      console.warn('⚠️  Could not delete test file:', deleteError.message)
    } else {
      console.log('✅ Test file deleted')
    }

    console.log()
    console.log('✨ Storage configuration is working correctly!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkStorage()
