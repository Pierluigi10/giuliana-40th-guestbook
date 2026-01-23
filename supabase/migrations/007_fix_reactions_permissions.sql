-- ============================================================================
-- Migration: Fix Reactions Permissions
-- Description: Allow all authenticated users (guest, vip, admin) to add reactions
-- Date: 2026-01-23
-- ============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "VIP and Admin can add reactions" ON reactions;

-- Create new policy allowing all authenticated users to add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = reactions.content_id
      AND content.approved_at IS NOT NULL
    )
  );

-- Verify the policy was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reactions'
    AND policyname = 'Authenticated users can add reactions'
  ) THEN
    RAISE EXCEPTION 'Policy "Authenticated users can add reactions" was not created successfully';
  END IF;

  RAISE NOTICE '✓ Reactions permissions fixed: all authenticated users can now add reactions';
END $$;
