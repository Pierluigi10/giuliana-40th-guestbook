-- ============================================================================
-- Migration 004: Remove User Approval System
-- ============================================================================
-- Date: 2026-01-23
-- Description: Replaces manual admin approval with native Supabase email
--              confirmation. Users confirm email and access directly.
--              Admin only approves content.
-- ============================================================================

-- ============================================================================
-- PART 1: Automatically Approve Existing Users
-- ============================================================================
-- Ensures backward compatibility: all existing guests can
-- continue using the app without interruptions.

UPDATE public.profiles
SET is_approved = true
WHERE role = 'guest' AND is_approved = false;

-- Log result
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Automatically approved % existing guest users', updated_count;
END $$;

-- ============================================================================
-- PART 2: Modify Trigger for New Users
-- ============================================================================
-- New users will have is_approved = TRUE by default.
-- Email confirmation is handled by Supabase Auth, not by the is_approved field.

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with is_approved = TRUE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'guest',
    TRUE  -- ✨ Changed from FALSE to TRUE
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: Update Column Metadata
-- ============================================================================
-- Documents that is_approved is now always TRUE and deprecated for manual approval.

COMMENT ON COLUMN public.profiles.is_approved IS
  'Always TRUE for new users. Manual approval system removed on 2026-01-23. '
  'User confirmation is handled via Supabase Auth email verification. '
  'Field kept for backward compatibility and existing RLS policies.';

-- ============================================================================
-- PART 4: Verify Results
-- ============================================================================
-- Verification queries (to be executed manually after migration)

-- Verification 1: All guests must have is_approved = true
-- SELECT role, is_approved, COUNT(*)
-- FROM public.profiles
-- GROUP BY role, is_approved;

-- Verification 2: Trigger works correctly
-- SELECT id, email, full_name, role, is_approved
-- FROM public.profiles
-- ORDER BY created_at DESC
-- LIMIT 5;

-- Verification 3: RLS policies are still active
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'content', 'reactions');

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- ⚠️  RLS POLICIES NOT MODIFIED
--     Existing policies that check is_approved = true remain intact.
--     This ensures the system continues to work correctly.
--
-- ✅  BACKWARD COMPATIBLE
--     Users registered before migration continue to work.
--
-- 🔒  SECURITY MAINTAINED
--     Email confirmation handled by Supabase Auth (more secure than manual approval).
--
-- 📧  REQUIRED CONFIGURATION
--     Enable email confirmation in Supabase Dashboard:
--     - Authentication → Settings → Email confirmation: ENABLED
--     - Authentication → URL Configuration → Redirect URLs: /auth/callback
-- ============================================================================
