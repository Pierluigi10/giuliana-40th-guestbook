# Supabase Setup Guide for g_gift

**Estimated time**: 15-20 minutes
**Prerequisites**: Supabase account + project created

---

## Overview

This guide will help you configure the Supabase database for the guestbook. You will need to:

1. ✅ Execute 3 SQL scripts to create tables
2. ✅ Create storage bucket for photos/videos
3. ✅ Create admin and VIP users
4. ✅ Verify that everything works

---

## Quick Checklist

- [ ] Script 001_initial_schema.sql executed
- [ ] Script 002_rls_policies.sql executed
- [ ] Script 003_seed_data.sql executed
- [ ] Bucket 'content-media' created
- [ ] Storage policies configured
- [ ] Admin user created and promoted
- [ ] VIP user created and promoted
- [ ] Database connection test OK

---

## Step 1: Execute SQL Migrations

### 1.1 Access SQL Editor

1. Go to https://supabase.com/dashboard
2. Select the **g_gift** project (or the name you chose)
3. In the left menu, click **SQL Editor** (</> icon)

### 1.2 Execute 001_initial_schema.sql

**File**: `supabase/migrations/001_initial_schema.sql`

**What it does**: Creates main tables (profiles, content, reactions) with indexes and triggers.

**How to execute**:
1. In SQL Editor, click **New Query**
2. Copy ALL content of `supabase/migrations/001_initial_schema.sql`
3. Paste in the editor
4. Click **RUN** (or Ctrl/Cmd + Enter)
5. ✅ Verify that "Success. No rows returned" appears (this is normal!)

**Tables created**:
- `profiles` - User profiles (email, role, approval status)
- `content` - Uploaded content (text, photos, videos)
- `reactions` - Emoji reactions to content

### 1.3 Execute 002_rls_policies.sql

**File**: `supabase/migrations/002_rls_policies.sql`

**What it does**: Enables Row Level Security (RLS) on all tables.

**How to execute**:
1. **New Query** in SQL Editor
2. Copy ALL content of `supabase/migrations/002_rls_policies.sql`
3. Paste in the editor
4. Click **RUN**
5. ✅ Verify "Success. No rows returned"

**Policies created**:
- 15+ policies to control who can read/write/modify data
- Database-level security (even if you bypass the API, RLS blocks you)

### 1.4 Execute 003_seed_data.sql

**File**: `supabase/migrations/003_seed_data.sql`

**What it does**: Creates helper functions to promote users to admin/VIP.

**How to execute**:
1. **New Query** in SQL Editor
2. Copy ALL content of `supabase/migrations/003_seed_data.sql`
3. Paste in the editor
4. Click **RUN**
5. ✅ Verify "Success. No rows returned"

**Functions created**:
- `promote_to_admin(email)` - Promotes a user to admin
- `promote_to_vip(email)` - Promotes a user to VIP

---

## Step 2: Create Storage Bucket

### 2.1 Access Storage

1. In Supabase dashboard, click **Storage** in the left menu
2. Click **Create a new bucket**

### 2.2 Configure the Bucket

**Bucket name**: `content-media` (EXACTLY this name!)

**Configuration**:
- ✅ **Public bucket**: ❌ NO (leave "Private" checked)
- ✅ **File size limit**: 10 MB (optional, already controlled in code)
- ✅ **Allowed MIME types**: (leave empty, we manage in code)

Click **Create bucket**.

### 2.3 Configure Storage Policies

Now you must configure policies to allow upload/download.

**Method 1: SQL Editor (recommended)**

1. Go back to **SQL Editor**
2. Create a **New Query**
3. Copy and paste this script:

```sql
-- Policy 1: Authenticated users can UPLOAD files
CREATE POLICY "Authenticated users can upload content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-media' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 2: Authenticated users can READ their own files
CREATE POLICY "Users can read their own content"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-media' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 3: ADMIN and VIP can READ ALL files
CREATE POLICY "Admin and VIP can read all content"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-media' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vip')
  )
);

-- Policy 4: Users can DELETE their own files
CREATE POLICY "Users can delete their own content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-media' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
```

4. Click **RUN**
5. ✅ Verify "Success. No rows returned"

**Method 2: UI (alternative)**

1. Go to **Storage** → click **content-media** bucket
2. Click **Policies** (tab at top)
3. Click **New Policy**
4. Manually add the 4 policies above via UI

---

## Step 3: Create Admin and VIP Users

### 3.1 Create Admin User (Pierluigi)

**Option A: Via Authentication UI (recommended)**

1. In Supabase dashboard, click **Authentication** in left menu
2. Click **Users**
3. Click **Add user** → **Create new user**
4. Fill in:
   - **Email**: `your-admin-email@example.com` (e.g., pierluigi@example.com)
   - **Password**: Choose a secure password (min 8 characters)
   - ✅ **Auto Confirm User**: YES (check this option!)
5. Click **Create user**

**Option B: Via SQL (alternative)**

```sql
-- Insert admin user directly (bypass email confirmation)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'your-admin-email@example.com',
  crypt('your-secure-password', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### 3.2 Promote Admin User

1. Copy the admin email you just created
2. Go to **SQL Editor**
3. Execute:

```sql
SELECT promote_to_admin('your-admin-email@example.com');
```

4. ✅ Verify that "1 row(s) returned" or success message appears

### 3.3 Create VIP User (Giuliana)

Repeat the same steps for VIP:

1. **Authentication** → **Users** → **Add user**
2. Fill in:
   - **Email**: `giuliana@example.com` (Giuliana's email)
   - **Password**: Choose a password (communicate it to Giuliana privately)
   - ✅ **Auto Confirm User**: YES
3. Click **Create user**

### 3.4 Promote VIP User

1. Go to **SQL Editor**
2. Execute:

```sql
SELECT promote_to_vip('giuliana@example.com');
```

3. ✅ Verify success message

---

## Step 4: Verify Setup

### 4.1 Verify Tables Created

In **SQL Editor**, execute:

```sql
-- Check that tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

✅ **You should see**:
- `content`
- `profiles`
- `reactions`

### 4.2 Verify RLS Enabled

In **SQL Editor**, execute:

```sql
-- Check that RLS is active
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

✅ **`rowsecurity` column must be `true` for all tables**

### 4.3 Verify Policies

In **SQL Editor**, execute:

```sql
-- Count created policies
SELECT schemaname, tablename, COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

✅ **You should see**:
- `content`: ~6 policies
- `profiles`: ~4 policies
- `reactions`: ~3 policies

### 4.4 Verify Storage Bucket

1. Go to **Storage** in dashboard
2. ✅ Verify `content-media` bucket exists
3. Click on bucket → **Policies**
4. ✅ Verify 4 policies exist (upload, read own, read all admin/vip, delete own)

### 4.5 Verify Users Created

In **SQL Editor**, execute:

```sql
-- Verify admin and VIP
SELECT email, role, is_approved
FROM profiles
WHERE role IN ('admin', 'vip')
ORDER BY role;
```

✅ **You should see**:
- 1 row with `role='admin'` and `is_approved=true`
- 1 row with `role='vip'` and `is_approved=true`

---

## Step 5: Test Connection from App

Now test that the Next.js app connects correctly to the database.

### 5.1 Verify Environment Variables

In `.env.local` file, verify these are present:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**How to find these values**:
1. Supabase Dashboard → **Settings** (gear icon at bottom)
2. **API** in left menu
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 5.2 Start App in Dev Mode

```bash
cd /Users/pierluigibaiano/Development/g_gift
npm run dev
```

### 5.3 Test Admin Login

1. Open browser: http://localhost:3000/login
2. Enter:
   - Email: `your-admin-email@example.com`
   - Password: the one you chose
3. Click **Accedi**
4. ✅ You should be redirected to `/approve-users` (admin dashboard)

### 5.4 Test VIP Login

1. Open incognito window: http://localhost:3000/login
2. Enter:
   - Email: `giuliana@example.com`
   - Password: the one you chose
3. Click **Accedi**
4. ✅ You should be redirected to `/gallery` (VIP gallery)

---

## Troubleshooting

### Error: "relation 'profiles' does not exist"

**Cause**: Script 001_initial_schema.sql not executed correctly.

**Solution**:
1. Go to **SQL Editor**
2. Execute: `DROP TABLE IF EXISTS profiles CASCADE;`
3. Re-execute 001_initial_schema.sql from beginning

### Error: "permission denied for table profiles"

**Cause**: RLS policies not configured or not enabled.

**Solution**:
1. Verify RLS is active: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. If `rowsecurity=false`, re-execute 002_rls_policies.sql

### Error: "Storage object not found"

**Cause**: 'content-media' bucket not created or name incorrect.

**Solution**:
1. Go to **Storage** → verify `content-media` exists (exact name!)
2. If not exists, create bucket with correct name

### Error: "new row violates row-level security policy"

**Cause**: Storage policies not configured.

**Solution**:
1. Go to **SQL Editor**
2. Execute storage policies scripts (see Step 2.3)

### Error: "function promote_to_admin does not exist"

**Cause**: Script 003_seed_data.sql not executed.

**Solution**:
1. Go to **SQL Editor**
2. Re-execute 003_seed_data.sql

### Login fails with "Invalid login credentials"

**Cause**: User not created or wrong password.

**Solution**:
1. Go to **Authentication** → **Users**
2. Verify user exists
3. If exists, reset password: click 3 dots → **Reset password**
4. Copy new password and try again

---

## Setup Complete!

If all tests above passed, you have completed Supabase setup! 🎉

**Next steps**:
1. ✅ Complete E2E test (guest registration → approval → upload → moderation → gallery)
2. ✅ Deploy to Vercel
3. ✅ Invite first friends to test

---

## Support

If you have problems or questions:
- Check the **Troubleshooting** section above
- Consult Supabase documentation: https://supabase.com/docs
- Check logs in **SQL Editor** ("Results" tab shows detailed errors)

**Total estimated setup time**: 15-20 minutes (if everything works on first try)
