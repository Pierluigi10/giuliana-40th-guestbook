# SQL Cheatsheet for g_gift

Quick reference for common SQL operations in Supabase SQL Editor.

---

## User Management

### Create and Promote Admin

```sql
-- Step 1: Create user in Supabase Dashboard first
-- (Authentication → Users → Add User)

-- Step 2: Promote to admin
SELECT promote_to_admin('pierluigi@example.com');
```

### Create and Promote VIP

```sql
-- Step 1: Create user in Supabase Dashboard first
-- (Authentication → Users → Add User)

-- Step 2: Promote to VIP
SELECT promote_to_vip('giuliana@example.com');
```

### List All Users by Role

```sql
SELECT
  email,
  full_name,
  role,
  is_approved,
  created_at
FROM profiles
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'vip' THEN 2
    WHEN 'guest' THEN 3
  END,
  created_at DESC;
```

### Count Users by Role

```sql
SELECT
  role,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_approved = true) as approved,
  COUNT(*) FILTER (WHERE is_approved = false) as pending
FROM profiles
GROUP BY role
ORDER BY role;
```

### Find User by Email

```sql
SELECT * FROM profiles
WHERE email = 'user@example.com';
```

### Approve Pending User

```sql
UPDATE profiles
SET is_approved = true
WHERE email = 'guest@example.com';
```

### Change User Role

```sql
-- Change guest to admin
UPDATE profiles
SET role = 'admin', is_approved = true
WHERE email = 'user@example.com';

-- Change guest to VIP
UPDATE profiles
SET role = 'vip', is_approved = true
WHERE email = 'user@example.com';
```

---

## Content Management

### List All Content

```sql
SELECT
  c.id,
  p.email as author_email,
  c.text_content,
  c.is_approved,
  c.created_at
FROM content c
JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;
```

### Count Content by Status

```sql
SELECT
  is_approved,
  COUNT(*) as count
FROM content
GROUP BY is_approved;
```

### Approve Content

```sql
UPDATE content
SET is_approved = true
WHERE id = 'content-uuid-here';
```

### Reject/Delete Content

```sql
-- Soft delete (set to not approved)
UPDATE content
SET is_approved = false
WHERE id = 'content-uuid-here';

-- Hard delete (permanent)
DELETE FROM content
WHERE id = 'content-uuid-here';
```

### Find Content by User

```sql
SELECT
  c.*,
  p.email,
  p.full_name
FROM content c
JOIN profiles p ON c.user_id = p.id
WHERE p.email = 'user@example.com'
ORDER BY c.created_at DESC;
```

### List Content with Author Info

```sql
SELECT
  c.id,
  c.text_content,
  c.is_approved,
  c.created_at,
  p.email,
  p.full_name,
  p.role
FROM content c
JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## Reactions Management

### Count Reactions by Type

```sql
SELECT
  reaction_type,
  COUNT(*) as count
FROM reactions
GROUP BY reaction_type
ORDER BY count DESC;
```

### List Reactions for Content

```sql
SELECT
  r.reaction_type,
  p.email,
  p.full_name,
  r.created_at
FROM reactions r
JOIN profiles p ON r.user_id = p.id
WHERE r.content_id = 'content-uuid-here'
ORDER BY r.created_at DESC;
```

### Most Reacted Content

```sql
SELECT
  c.id,
  c.text_content,
  COUNT(r.id) as reaction_count,
  p.email as author_email
FROM content c
LEFT JOIN reactions r ON c.id = r.content_id
JOIN profiles p ON c.user_id = p.id
WHERE c.is_approved = true
GROUP BY c.id, c.text_content, p.email
ORDER BY reaction_count DESC
LIMIT 10;
```

---

## Database Health Checks

### Verify Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: `content`, `profiles`, `reactions`

### Verify RLS Enabled

```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Expected: `rowsecurity = true` for all tables

### Count RLS Policies

```sql
SELECT
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

Expected:
- `content`: ~6 policies
- `profiles`: ~4 policies
- `reactions`: ~3 policies

### List All Policies

```sql
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Storage Management

### List Files in Storage Bucket

```sql
SELECT
  name,
  bucket_id,
  created_at,
  (metadata->>'size')::bigint as size_bytes,
  (metadata->>'mimetype') as mime_type
FROM storage.objects
WHERE bucket_id = 'content-media'
ORDER BY created_at DESC
LIMIT 50;
```

### Storage Usage by User

```sql
SELECT
  (storage.foldername(name))[1] as user_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb
FROM storage.objects
WHERE bucket_id = 'content-media'
GROUP BY user_id
ORDER BY total_bytes DESC;
```

### Total Storage Used

```sql
SELECT
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0 / 1024.0, 2) as total_gb
FROM storage.objects
WHERE bucket_id = 'content-media';
```

Supabase free tier limit: 1 GB (1024 MB)

---

## Emergency Operations

### Delete All Pending Users (Cleanup)

```sql
-- WARNING: This permanently deletes unapproved guests
DELETE FROM profiles
WHERE role = 'guest' AND is_approved = false;
```

### Delete All Unapproved Content

```sql
-- WARNING: This permanently deletes rejected content
DELETE FROM content
WHERE is_approved = false;
```

### Reset Admin Role (Recovery)

```sql
-- If you lose admin access, re-promote yourself
UPDATE profiles
SET role = 'admin', is_approved = true
WHERE email = 'your-email@example.com';
```

### Find Orphaned Content (No User)

```sql
SELECT c.*
FROM content c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE p.id IS NULL;
```

Should return 0 rows (foreign key constraint prevents this)

---

## Analytics Queries

### Daily Activity Stats

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as items,
  'content' as type
FROM content
GROUP BY DATE(created_at)
UNION ALL
SELECT
  DATE(created_at) as date,
  COUNT(*) as items,
  'reactions' as type
FROM reactions
GROUP BY DATE(created_at)
UNION ALL
SELECT
  DATE(created_at) as date,
  COUNT(*) as items,
  'users' as type
FROM profiles
WHERE role = 'guest'
GROUP BY DATE(created_at)
ORDER BY date DESC, type;
```

### User Engagement Report

```sql
SELECT
  p.email,
  p.full_name,
  COUNT(DISTINCT c.id) as content_count,
  COUNT(DISTINCT r.id) as reaction_count,
  MAX(c.created_at) as last_content,
  MAX(r.created_at) as last_reaction
FROM profiles p
LEFT JOIN content c ON p.id = c.user_id
LEFT JOIN reactions r ON p.id = r.user_id
WHERE p.role = 'guest' AND p.is_approved = true
GROUP BY p.email, p.full_name
ORDER BY content_count DESC, reaction_count DESC;
```

### Content Approval Rate

```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_approved = true) as approved,
  COUNT(*) FILTER (WHERE is_approved = false) as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_approved = true) / COUNT(*), 1) as approval_rate
FROM content;
```

---

## Backup & Export

### Export All Users

```sql
-- Copy results to CSV
SELECT
  email,
  full_name,
  role,
  is_approved,
  created_at
FROM profiles
ORDER BY created_at;
```

### Export All Content

```sql
-- Copy results to CSV
SELECT
  c.id,
  p.email as author_email,
  p.full_name as author_name,
  c.text_content,
  c.image_url,
  c.video_url,
  c.is_approved,
  c.created_at
FROM content c
JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at;
```

### Export All Reactions

```sql
-- Copy results to CSV
SELECT
  r.content_id,
  r.reaction_type,
  p.email as user_email,
  p.full_name as user_name,
  r.created_at
FROM reactions r
JOIN profiles p ON r.user_id = p.id
ORDER BY r.created_at;
```

---

## Tips

### Execute Multiple Queries

Separate queries with semicolons and run them all at once:

```sql
SELECT promote_to_admin('admin@example.com');
SELECT promote_to_vip('vip@example.com');
SELECT * FROM profiles WHERE role IN ('admin', 'vip');
```

### Use LIMIT for Large Results

Always add LIMIT when querying large tables:

```sql
SELECT * FROM content ORDER BY created_at DESC LIMIT 100;
```

### Format Output

Use column aliases for readable output:

```sql
SELECT
  email as "Email Address",
  full_name as "Full Name",
  CASE
    WHEN role = 'admin' THEN 'Administrator'
    WHEN role = 'vip' THEN 'VIP Guest'
    ELSE 'Regular Guest'
  END as "User Role",
  CASE
    WHEN is_approved THEN 'Approved'
    ELSE 'Pending'
  END as "Status"
FROM profiles;
```

---

## Common Patterns

### Transaction Example

```sql
BEGIN;
  UPDATE profiles SET is_approved = true WHERE email = 'user1@example.com';
  UPDATE profiles SET is_approved = true WHERE email = 'user2@example.com';
  UPDATE profiles SET is_approved = true WHERE email = 'user3@example.com';
COMMIT;
```

### Conditional Update

```sql
UPDATE profiles
SET is_approved = true
WHERE role = 'guest'
  AND is_approved = false
  AND created_at < NOW() - INTERVAL '1 day';
```

### Safe Delete (Check First)

```sql
-- Step 1: Preview what will be deleted
SELECT * FROM profiles
WHERE role = 'guest' AND is_approved = false;

-- Step 2: If OK, delete
DELETE FROM profiles
WHERE role = 'guest' AND is_approved = false;
```

---

**Last Updated**: 2026-01-23
