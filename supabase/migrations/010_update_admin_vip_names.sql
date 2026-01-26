-- ============================================================================
-- UPDATE ADMIN AND VIP DISPLAY NAMES
-- ============================================================================
-- This migration updates the full_name field for admin and vip users
-- that currently have empty or null display names.

-- Update admin users with empty or null full_name
UPDATE profiles
SET full_name = 'Pierluigi'
WHERE role = 'admin'
  AND (full_name IS NULL OR full_name = '' OR TRIM(full_name) = '');

-- Update vip users with empty or null full_name
UPDATE profiles
SET full_name = 'Giuliana'
WHERE role = 'vip'
  AND (full_name IS NULL OR full_name = '' OR TRIM(full_name) = '');

-- Verify the updates
-- Uncomment to check the results:
-- SELECT email, full_name, role FROM profiles WHERE role IN ('admin', 'vip');
