-- ============================================================================
-- SEED DATA: Admin and VIP Users
-- ============================================================================
-- This script provides helper functions to promote users to admin/vip roles.
--
-- IMPORTANT: Supabase requires users to be created via Authentication UI or API first,
-- then profiles are automatically created via trigger (see 001_initial_schema.sql).
-- After user creation, use the helper functions below to promote them.
--
-- See full instructions in: docs/SUPABASE_SETUP.md (Step 3)
-- ============================================================================

-- ============================================================================
-- METHOD 1: MANUAL USER CREATION (Recommended - Most Secure)
-- ============================================================================
-- This is the recommended approach for production environments.
--
-- Step 1: Create users via Supabase Dashboard
--   1. Go to: Supabase Dashboard → Authentication → Users
--   2. Click "Add user" → "Create new user"
--   3. For ADMIN (Pierluigi):
--      - Email: your-real-admin-email@example.com
--      - Password: Generate a strong password (min 12 chars)
--      - Auto Confirm User: YES (check this!)
--      - Click "Create user"
--   4. For VIP (Giuliana):
--      - Email: giuliana-real-email@example.com
--      - Password: Generate a strong password (min 12 chars)
--      - Auto Confirm User: YES (check this!)
--      - Click "Create user"
--
-- Step 2: Promote users using helper functions (see below)
--   Execute in SQL Editor:
--     SELECT promote_to_admin('your-real-admin-email@example.com');
--     SELECT promote_to_vip('giuliana-real-email@example.com');
--
-- Step 3: Verify users were promoted correctly
--   Execute in SQL Editor:
--     SELECT email, role, is_approved FROM profiles
--     WHERE role IN ('admin', 'vip');
--
-- SECURITY NOTE: Store passwords in a password manager (1Password, Bitwarden, etc.)
-- DO NOT commit real credentials to Git!

-- ============================================================================
-- METHOD 2: AUTOMATED SEED (Development/Testing Only)
-- ============================================================================
-- WARNING: This method stores passwords in plaintext in this file.
-- ONLY use for local development/testing. NEVER use in production.
-- NEVER commit this file with real passwords to Git.
--
-- Uncomment and modify the section below if you want automated seeding:

/*
-- DEVELOPMENT SEED DATA (Uncomment to use)
-- Replace emails and passwords with your test credentials

-- Create admin user (development only)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'pierluigi.dev@example.com', -- CHANGE THIS
    crypt('DevPassword123!', gen_salt('bf')), -- CHANGE THIS
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pierluigi"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    ''
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO admin_user_id;

  -- Promote to admin (profile created automatically via trigger)
  IF admin_user_id IS NOT NULL THEN
    PERFORM promote_to_admin('pierluigi.dev@example.com');
  END IF;
END $$;

-- Create VIP user (development only)
DO $$
DECLARE
  vip_user_id UUID;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'giuliana.dev@example.com', -- CHANGE THIS
    crypt('DevPassword123!', gen_salt('bf')), -- CHANGE THIS
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Giuliana"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    ''
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO vip_user_id;

  -- Promote to vip (profile created automatically via trigger)
  IF vip_user_id IS NOT NULL THEN
    PERFORM promote_to_vip('giuliana.dev@example.com');
  END IF;
END $$;
*/

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
