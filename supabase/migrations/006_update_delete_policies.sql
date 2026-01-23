-- ============================================================================
-- UPDATE DELETE POLICIES - Allow users to delete their own content
-- ============================================================================
-- This migration updates the DELETE policies to allow:
-- - Users to delete their own content
-- - VIP and Admin to delete any content

-- 1. Drop existing policy
DROP POLICY IF EXISTS "Admin can delete content" ON content;
DROP POLICY IF EXISTS "Admin and VIP can delete content" ON content;

-- 2. Create new policy allowing users to delete own content + VIP/Admin to delete any
CREATE POLICY "Users can delete own content, VIP and Admin can delete any"
  ON content FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'vip')
  );

-- Verification query (optional - for testing)
-- SELECT * FROM pg_policies WHERE tablename = 'content' AND cmd = 'DELETE';
