-- ============================================================================
-- Fix Supabase Security Warnings: Function Search Path
-- ============================================================================
-- Fixes security warnings for promote_to_admin and promote_to_vip functions
-- by adding explicit search_path to prevent search path manipulation attacks.
--
-- Safe to run on live database:
-- - CREATE OR REPLACE is atomic (zero downtime)
-- - Function logic unchanged (only security hardening)
-- - No user-facing impact (functions used only for admin operations)
--
-- Related warnings:
-- - function_search_path_mutable: public.promote_to_admin
-- - function_search_path_mutable: public.promote_to_vip
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Promote user to admin (with fixed search_path)
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin', is_approved = true
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION promote_to_admin IS 'Promotes user to admin role. Fixed search_path for security.';

-- ============================================================================
-- HELPER FUNCTION: Promote user to VIP (with fixed search_path)
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_to_vip(user_email TEXT)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET role = 'vip', is_approved = true
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION promote_to_vip IS 'Promotes user to VIP role. Fixed search_path for security.';

-- ============================================================================
-- VERIFICATION QUERY (Optional - run manually to verify fix)
-- ============================================================================
-- Uncomment and run in SQL Editor to verify functions have correct search_path:
--
-- SELECT
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as arguments,
--   p.prosecdef as is_security_definer,
--   p.proconfig as config_settings
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN ('promote_to_admin', 'promote_to_vip');
--
-- Expected: config_settings should contain {search_path=public,pg_temp}
-- ============================================================================
