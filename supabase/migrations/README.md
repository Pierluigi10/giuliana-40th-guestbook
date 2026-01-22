# Database Migrations

SQL migration files for Giuliana's 40th Birthday Guestbook.

## Files

1. **001_initial_schema.sql** - Tables, indexes, triggers
2. **002_rls_policies.sql** - Row Level Security policies
3. **003_seed_data.sql** - Admin and VIP user setup instructions

## How to Run

### Option 1: Supabase Dashboard (Manual)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `g_gift`
3. Go to **SQL Editor**
4. Click **New query**
5. Copy the contents of each migration file (in order)
6. Click **Run** for each migration

### Option 2: Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref uukkrekcxlqfaaflmjwy

# Run migrations
supabase db push
```

### Option 3: Let Ralph do it

Ralph can execute these migrations automatically when you run:

```bash
./ralph.sh
```

## After Running Migrations

### Create Admin User

1. Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Email: your-email@example.com
3. Password: (choose strong password)
4. Auto-confirm email: **YES**
5. Go to **SQL Editor** and run:

```sql
SELECT promote_to_admin('your-email@example.com');
```

### Create VIP User (Giuliana)

1. Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Email: giuliana-email@example.com
3. Password: (choose strong password)
4. Auto-confirm email: **YES**
5. Go to **SQL Editor** and run:

```sql
SELECT promote_to_vip('giuliana-email@example.com');
```

### Create Storage Bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `content-media`
3. Public: **YES** (for serving images/videos)
4. File size limit: 10 MB
5. Allowed MIME types: `image/*`, `video/*`

## Verification

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';

-- Check users
SELECT email, role, is_approved FROM profiles;
```

## Rollback

If you need to start over:

```sql
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS promote_to_admin(TEXT);
DROP FUNCTION IF EXISTS promote_to_vip(TEXT);
```

Then re-run the migrations.
