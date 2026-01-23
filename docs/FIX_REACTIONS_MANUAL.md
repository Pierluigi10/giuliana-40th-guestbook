# How to Fix Reactions Issue

## Problem
Guest users cannot add reactions to content in the gallery.

## Cause
The system had two restrictions preventing guests from adding reactions:
1. **TypeScript code** - checked that only VIP and Admin could add reactions
2. **Database RLS Policy** - the policy only allowed VIP and Admin to insert reactions

## Solution

### ✅ Part 1: TypeScript Code (ALREADY FIXED)
The file `src/actions/reactions.ts` has already been updated to allow all authenticated users to add reactions.

### ⚠️  Part 2: Database Policy (MUST BE EXECUTED MANUALLY)

You need to run this SQL migration in your Supabase database:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor** in the sidebar

2. **Copy and paste this SQL** into the SQL Editor:

```sql
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
```

3. **Click "Run"** to execute the query

4. **Verify** that the policy was created:

```sql
-- Check reactions table policies
SELECT * FROM pg_policies WHERE tablename = 'reactions';
```

You should see:
- Policy "Authenticated users can add reactions" for INSERT
- Policy "Users can read reactions on approved content" for SELECT
- Policy "Users can delete their own reactions" for DELETE

## Verification

After running the migration:

1. **Restart the application** (if in development):
   ```bash
   npm run dev
   ```

2. **Test reactions**:
   - Log in as guest
   - Go to the gallery
   - Try adding a reaction to content
   - Verify it works without errors

## Modified Files

- ✅ `src/actions/reactions.ts` - removed role check
- ✅ `supabase/migrations/007_fix_reactions_permissions.sql` - new SQL migration
- ⚠️  Supabase Database - **YOU MUST EXECUTE MANUALLY** the migration

## Technical Notes

The new policy allows all authenticated users (guest, vip, admin) to:
- ✅ Add reactions only to approved content
- ✅ Remove their own reactions
- ✅ See all reactions on approved content

Security is maintained because:
- Only authenticated users can add reactions
- Reactions can only be added to approved content
- Users can only delete their own reactions
