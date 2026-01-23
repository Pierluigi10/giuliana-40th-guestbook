-- ============================================================================
-- CREATE STORAGE BUCKET AND POLICIES
-- ============================================================================
-- This migration creates the content-media storage bucket and sets up RLS policies
-- for authenticated users to upload images and videos.

-- 1. Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-media',
  'content-media',
  true, -- public bucket so VIP can view approved content
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- 4. Create policy: Authenticated users can upload files to their own folder
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-media' AND
    -- Users can only upload to their own folder: {user_id}/filename
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Create policy: Anyone can view files (public bucket)
CREATE POLICY "Users can view media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content-media');

-- 6. Create policy: Admin can delete any file
CREATE POLICY "Admin can delete files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-media' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7. Create policy: Users can update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verification query (optional - for testing)
-- SELECT * FROM storage.buckets WHERE id = 'content-media';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
