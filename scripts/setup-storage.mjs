#!/usr/bin/env node

/**
 * Setup Supabase Storage bucket and policies
 * Run: node scripts/setup-storage.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🚀 Setting up Supabase Storage...\n')

// SQL to execute
const sql = `
-- 1. Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-media',
  'content-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- 4. Create upload policy
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Create read policy
CREATE POLICY "Users can view media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'content-media');

-- 6. Create delete policy
CREATE POLICY "Admin can delete files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'content-media' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7. Create update policy
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
`

try {
  console.log('📝 Executing SQL migration...')

  const { data, error } = await supabase.rpc('exec', { sql })

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Storage bucket and policies created successfully!')
  console.log('\n📊 Verifying bucket...')

  // Verify bucket exists
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets()

  if (bucketsError) {
    console.error('⚠️  Could not verify buckets:', bucketsError.message)
  } else {
    const contentMediaBucket = buckets.find(b => b.id === 'content-media')
    if (contentMediaBucket) {
      console.log('✅ Bucket "content-media" verified!')
      console.log('   - Public:', contentMediaBucket.public)
      console.log('   - Size limit:', contentMediaBucket.file_size_limit, 'bytes')
    } else {
      console.log('⚠️  Bucket "content-media" not found in list')
    }
  }

  console.log('\n🎉 Setup complete! Try uploading an image now.')

} catch (error) {
  console.error('❌ Unexpected error:', error.message)
  process.exit(1)
}
`