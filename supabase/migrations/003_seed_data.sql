-- Seed data for initial setup
-- Creates admin and VIP users

-- ============================================================================
-- ADMIN USER (Pierluigi)
-- ============================================================================
-- Note: You need to create this user manually in Supabase Dashboard first:
-- 1. Go to Authentication → Users → Add User
-- 2. Email: your-admin-email@example.com
-- 3. Password: (set a strong password)
-- 4. Confirm email automatically
-- 5. Copy the user ID and replace 'ADMIN_USER_ID' below

-- After creating the admin user, run this to set role:
-- UPDATE profiles
-- SET role = 'admin', is_approved = true
-- WHERE email = 'your-admin-email@example.com';

-- ============================================================================
-- VIP USER (Giuliana)
-- ============================================================================
-- Note: You need to create this user manually in Supabase Dashboard first:
-- 1. Go to Authentication → Users → Add User
-- 2. Email: giuliana-email@example.com
-- 3. Password: (set a strong password)
-- 4. Confirm email automatically
-- 5. Copy the user ID and replace 'VIP_USER_ID' below

-- After creating the VIP user, run this to set role:
-- UPDATE profiles
-- SET role = 'vip', is_approved = true
-- WHERE email = 'giuliana-email@example.com';

-- ============================================================================
-- INSTRUCTIONS FOR MANUAL SETUP
-- ============================================================================

-- 1. Create Admin User:
--    - Supabase Dashboard → Authentication → Users → Add User
--    - Email: pierluigi@example.com (or your real email)
--    - Auto-confirm email: YES
--    - After creation, run:
--      UPDATE profiles SET role = 'admin', is_approved = true
--      WHERE email = 'pierluigi@example.com';

-- 2. Create VIP User (Giuliana):
--    - Supabase Dashboard → Authentication → Users → Add User
--    - Email: giuliana@example.com (or her real email)
--    - Auto-confirm email: YES
--    - After creation, run:
--      UPDATE profiles SET role = 'vip', is_approved = true
--      WHERE email = 'giuliana@example.com';

-- 3. Test Users (Optional):
--    Create a few test guest users to verify the approval flow works.

-- ============================================================================
-- HELPER FUNCTION: Promote user to admin
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin', is_approved = true
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage: SELECT promote_to_admin('your-email@example.com');

-- ============================================================================
-- HELPER FUNCTION: Promote user to VIP
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_to_vip(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET role = 'vip', is_approved = true
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage: SELECT promote_to_vip('giuliana@example.com');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all profiles and their roles:
-- SELECT email, full_name, role, is_approved, created_at FROM profiles ORDER BY created_at;

-- Check admin exists:
-- SELECT * FROM profiles WHERE role = 'admin';

-- Check VIP exists:
-- SELECT * FROM profiles WHERE role = 'vip';
