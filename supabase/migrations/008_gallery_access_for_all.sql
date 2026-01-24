-- ============================================================================
-- Migration: Gallery Access for All Authenticated Users
-- Description: Allow all authenticated users (not just VIP) to view gallery and add reactions
-- Date: 2026-01-24
-- ============================================================================

-- ============================================================================
-- CONTENT POLICIES - Update to allow all authenticated users to view approved content
-- ============================================================================

-- 1. Drop existing restrictive policy for VIP/Admin only
DROP POLICY IF EXISTS "Approved content readable by VIP and Admin" ON content;

-- 2. Create new policy allowing all authenticated users to view approved content
CREATE POLICY "Approved content readable by authenticated users"
  ON content FOR SELECT
  TO authenticated
  USING (
    status = 'approved' OR
    user_id = auth.uid()
  );

-- Note: The "Users can read their own content" policy is no longer needed as it's covered above
DROP POLICY IF EXISTS "Users can read their own content" ON content;

-- ============================================================================
-- REACTIONS POLICIES - Already updated in migration 007, but verify
-- ============================================================================

-- Verify that all authenticated users can add reactions (already done in migration 007)
-- Policy "Authenticated users can add reactions" should exist

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

DO $$
BEGIN
  -- Verify content policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'content'
    AND policyname = 'Approved content readable by authenticated users'
  ) THEN
    RAISE EXCEPTION 'Policy "Approved content readable by authenticated users" was not created successfully';
  END IF;

  -- Verify reactions policy exists (from migration 007)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reactions'
    AND policyname = 'Authenticated users can add reactions'
  ) THEN
    RAISE WARNING 'Policy "Authenticated users can add reactions" not found - may need to run migration 007 first';
  END IF;

  RAISE NOTICE '✓ Gallery access updated: all authenticated users can now view approved content and add reactions';
END $$;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. ✓ All authenticated users can view approved content (not just VIP/Admin)
-- 2. ✓ All authenticated users can add reactions (already done in migration 007)
-- 3. ✓ Users can still delete their own content (from migration 006)
-- 4. ✓ Users can view their own content regardless of status (via user_id check)
