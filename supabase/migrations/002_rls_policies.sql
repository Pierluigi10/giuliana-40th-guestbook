-- Row Level Security (RLS) Policies
-- Ensures database-level security - no API bypass possible

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- All authenticated users can read profiles (to see author names)
CREATE POLICY "Profiles are readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile (name only, not role/approval)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
    is_approved = (SELECT is_approved FROM profiles WHERE id = auth.uid())
  );

-- Admin can update any profile (for approval)
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- CONTENT POLICIES
-- ============================================================================

-- Approved content is readable by VIP and Admin
CREATE POLICY "Approved content readable by VIP and Admin"
  ON content FOR SELECT
  TO authenticated
  USING (
    status = 'approved' AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('vip', 'admin')
    )
  );

-- Pending content is readable only by Admin
CREATE POLICY "Pending content readable by Admin only"
  ON content FOR SELECT
  TO authenticated
  USING (
    status = 'pending' AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Users can read their own content regardless of status
CREATE POLICY "Users can read their own content"
  ON content FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Approved guests can insert content (auto-set to pending)
CREATE POLICY "Approved guests can insert content"
  ON content FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guest' AND
    (SELECT is_approved FROM profiles WHERE id = auth.uid()) = true AND
    status = 'pending'
  );

-- Admin can update content status (approve/reject)
CREATE POLICY "Admin can update content status"
  ON content FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin can delete content
CREATE POLICY "Admin can delete content"
  ON content FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- REACTIONS POLICIES
-- ============================================================================

-- Users can read reactions on approved content
CREATE POLICY "Users can read reactions on approved content"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = reactions.content_id
      AND content.status = 'approved'
    )
  );

-- VIP and Admin can insert reactions
CREATE POLICY "VIP and Admin can add reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('vip', 'admin') AND
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_id
      AND content.status = 'approved'
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STORAGE POLICIES (for content-media bucket)
-- ============================================================================

-- Note: Storage policies must be set in Supabase Dashboard → Storage → Policies
-- Or use these SQL statements after creating the bucket:

-- Allow approved guests to upload files
-- CREATE POLICY "Approved guests can upload files"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'content-media' AND
--     (SELECT role FROM profiles WHERE id = auth.uid()) = 'guest' AND
--     (SELECT is_approved FROM profiles WHERE id = auth.uid()) = true AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );

-- Allow authenticated users to read approved content
-- CREATE POLICY "Authenticated users can view media"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'content-media');

-- Allow admin to delete files
-- CREATE POLICY "Admin can delete files"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (
--     bucket_id = 'content-media' AND
--     (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
--   );
