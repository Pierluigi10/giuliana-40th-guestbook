# Database Schema Documentation

**Project**: Giuliana's 40th Birthday Guestbook
**Database**: PostgreSQL 15 (Supabase Cloud)
**Last Updated**: 2026-01-27

## Overview

The database schema consists of three main tables:
- **profiles**: User metadata with role-based access control
- **content**: User-submitted messages, photos, and videos
- **reactions**: Emoji reactions from authenticated users

All tables are protected by Row Level Security (RLS) policies enforcing strict access control at the database level.

---

## Tables

### 1. profiles

Extends Supabase `auth.users` with application-specific metadata.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'vip', 'guest')),
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
- `id`: UUID (foreign key to `auth.users.id`, CASCADE delete)
- `email`: User email (unique, not null)
- `full_name`: User's full name
- `role`: One of `admin`, `vip`, or `guest` (default: `guest`)
- `is_approved`: Always TRUE since migration 004 (email confirmation handles access)
- `created_at`: Account creation timestamp

**Indexes**:
- `idx_profiles_role` on `role`
- `idx_profiles_approved` on `is_approved`

**Constraints**:
- Role must be one of: `admin`, `vip`, `guest`
- Email must be unique

**Trigger**:
- `on_auth_user_created`: Auto-creates profile when user signs up

---

### 2. content

Stores user-submitted content (text messages, photos, videos).

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video')),
  text_content TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT content_has_value CHECK (
    (type = 'text' AND text_content IS NOT NULL) OR
    (type IN ('image', 'video') AND media_url IS NOT NULL)
  )
);
```

**Columns**:
- `id`: UUID (auto-generated)
- `user_id`: Foreign key to `profiles.id` (CASCADE delete)
- `type`: Content type: `text`, `image`, or `video`
- `text_content`: Text message content (required if type='text')
- `media_url`: URL to media file in Supabase Storage (required if type='image'|'video')
- `status`: Moderation status: `pending` (default), `approved`, `rejected`
- `approved_at`: Timestamp when admin approved the content
- `created_at`: Content submission timestamp

**Indexes**:
- `idx_content_status` on `status`
- `idx_content_user` on `user_id`
- `idx_content_created` on `created_at DESC`

**Constraints**:
- Type must be one of: `text`, `image`, `video`
- Status must be one of: `pending`, `approved`, `rejected`
- Content validation: text content required for text type, media_url required for image/video

---

### 3. reactions

Stores emoji reactions on approved content.

```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_id, user_id, emoji)
);
```

**Columns**:
- `id`: UUID (auto-generated)
- `content_id`: Foreign key to `content.id` (CASCADE delete)
- `user_id`: Foreign key to `profiles.id` (CASCADE delete)
- `emoji`: Emoji character (e.g., '❤️', '🎉', '😂')
- `created_at`: Reaction timestamp

**Indexes**:
- `idx_reactions_content` on `content_id`

**Constraints**:
- Unique constraint on `(content_id, user_id, emoji)`: prevents duplicate reactions

---

## Row Level Security (RLS) Policies

All tables have RLS enabled with strict policies enforcing security at the database level.

### profiles Policies

1. **"Profiles are readable by authenticated users"**
   - **Operation**: SELECT
   - **Who**: All authenticated users
   - **Why**: Users need to see author names on content

2. **"Users can update their own profile"**
   - **Operation**: UPDATE
   - **Who**: Own profile only
   - **Restriction**: Cannot change role or is_approved
   - **Why**: Users can update their name, but not escalate privileges

3. **"Admin can update any profile"**
   - **Operation**: UPDATE
   - **Who**: Admin only
   - **Why**: Admin can approve users or change roles

### content Policies

1. **"Approved content readable by authenticated users"** (Migration 008)
   - **Operation**: SELECT
   - **Who**: All authenticated users
   - **Condition**: `status = 'approved'` OR user owns the content
   - **Why**: All users can view approved content; users can see their own pending content

2. **"Pending content readable by Admin only"**
   - **Operation**: SELECT
   - **Who**: Admin only
   - **Condition**: `status = 'pending'`
   - **Why**: Admin reviews content before it's visible to others

3. **"Approved guests can insert content"**
   - **Operation**: INSERT
   - **Who**: Approved guests only
   - **Condition**: `role = 'guest'` AND `is_approved = true` AND `status = 'pending'`
   - **Why**: Only approved guests can submit content, which starts as pending

4. **"Admin can update content status"**
   - **Operation**: UPDATE
   - **Who**: Admin only
   - **Why**: Admin approves or rejects content

5. **"Admin can delete content"**
   - **Operation**: DELETE
   - **Who**: Admin only
   - **Why**: Admin can remove inappropriate content

### reactions Policies

1. **"Users can read reactions on approved content"**
   - **Operation**: SELECT
   - **Who**: All authenticated users
   - **Condition**: Reaction belongs to approved content
   - **Why**: Users can see reaction counts on visible content

2. **"Authenticated users can add reactions"** (Migration 007)
   - **Operation**: INSERT
   - **Who**: All authenticated users
   - **Condition**: Content is approved, user is authenticated
   - **Why**: All authenticated users can react to approved content

3. **"Users can delete their own reactions"**
   - **Operation**: DELETE
   - **Who**: Own reactions only
   - **Why**: Users can remove their reactions (toggle functionality)

---

## Storage

### content-media Bucket

**Configuration**:
- **Name**: `content-media`
- **Public**: Yes (files are served via signed URLs)
- **Max file size**: 20MB (increased in migration 009)
- **Allowed MIME types**: `image/*`, `video/*`

**Path structure**: `{userId}/{contentId}.{ext}`

**Storage Policies** (see migration 005):
1. Approved guests can upload files to their own folder
2. All authenticated users can read files
3. Admin can delete files

---

## Migrations History

| Migration | Date | Description |
|-----------|------|-------------|
| 001_initial_schema.sql | 2026-01-22 | Created profiles, content, reactions tables with indexes and triggers |
| 002_rls_policies.sql | 2026-01-22 | Implemented RLS policies for all tables |
| 003_seed_data.sql | 2026-01-22 | Helper functions for creating admin/VIP users |
| 004_remove_user_approval.sql | 2026-01-23 | Switched from manual approval to email confirmation |
| 005_storage_bucket_and_policies.sql | 2026-01-23 | Created storage bucket with policies |
| 006_update_delete_policies.sql | 2026-01-23 | Added content deletion policies |
| 007_fix_reactions_permissions.sql | 2026-01-23 | Allowed all users to add reactions |
| 008_gallery_access_for_all.sql | 2026-01-24 | Allowed all authenticated users to view gallery |
| 009_increase_video_size_limit.sql | 2026-01-26 | Increased video upload limit to 20MB |
| 010_update_admin_vip_names.sql | 2026-01-26 | Updated admin and VIP user names |

---

## Verification Queries

### Check Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check RLS Status
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Check Policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Indexes
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check Users
```sql
SELECT email, role, is_approved, created_at
FROM profiles
ORDER BY created_at DESC;
```

### Check Content Statistics
```sql
SELECT
  type,
  status,
  COUNT(*) as count
FROM content
GROUP BY type, status
ORDER BY type, status;
```

---

## Security Features

### Database-Level Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies enforce role-based access control
- ✅ Foreign key constraints with CASCADE delete
- ✅ Check constraints on enum-like columns
- ✅ Unique constraints prevent duplicate data

### Authentication
- ✅ JWT-based authentication via Supabase Auth
- ✅ Email confirmation required for new users
- ✅ Passwords hashed with bcrypt
- ✅ Session management handled by Supabase

### Authorization
- ✅ Three roles: admin, vip, guest
- ✅ Admin can moderate all content
- ✅ Guests can only submit content (starts as pending)
- ✅ All authenticated users can view approved content
- ✅ Users can only modify their own data

### Data Integrity
- ✅ Foreign key relationships maintain referential integrity
- ✅ Cascade deletes prevent orphaned records
- ✅ Triggers auto-create profiles on user registration
- ✅ Constraints validate data before insertion

---

## Performance Optimizations

- Indexes on frequently queried columns (status, user_id, created_at)
- Composite unique constraint on reactions prevents duplicates
- Descending index on content.created_at for efficient sorting
- Profile trigger uses SECURITY DEFINER for controlled access

---

## Backup and Recovery

### Automated Backups (Supabase Cloud)
- Daily automated backups (retention: 7 days on free tier)
- Point-in-time recovery available on Pro tier

### Manual Export
```bash
# Export schema
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --schema-only > schema.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --data-only > data.sql
```

---

## Requirements Compliance

### DB-001: Database Schema ✅
- ✅ profiles table with role and is_approved
- ✅ content table with type, text_content, media_url, status
- ✅ reactions table with emoji reactions
- ✅ Proper foreign keys with CASCADE delete
- ✅ Check constraints for data validation
- ✅ Indexes for performance
- ✅ Triggers for auto-profile creation

### DB-002: Row Level Security ✅
- ✅ RLS enabled on all tables
- ✅ Guests can only read their own content
- ✅ Admin can read all, approve content
- ✅ All authenticated users can read approved content (updated in migration 008)
- ✅ Proper RLS on profiles, content, reactions tables

---

## Contact

For questions or issues:
- Check Supabase Dashboard logs
- Review migration files in `supabase/migrations/`
- Consult `specs/architecture.md` for design decisions
