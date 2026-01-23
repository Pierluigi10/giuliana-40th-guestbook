# Quick Start: Create Admin and VIP Users

**Goal**: Set up admin (Pierluigi) and VIP (Giuliana) users in 5 minutes.

**Prerequisites**:
- Supabase migrations already executed (`001_initial_schema.sql`, `002_rls_policies.sql`, `003_seed_data.sql`)
- Supabase Dashboard access: https://supabase.com/dashboard

---

## Step 1: Create Users (2 minutes)

### Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **g_gift** project
3. Click **Authentication** (in left menu)
4. Click **Users**

### Create Admin User

1. Click **Add user** → **Create new user**
2. Fill in:
   ```
   Email: your-real-email@example.com
   Password: [Generate in password manager]
   Auto Confirm User: ✓ YES
   ```
3. Click **Create user**
4. Copy the email address (you'll need it in Step 2)

### Create VIP User

1. Click **Add user** → **Create new user** again
2. Fill in:
   ```
   Email: giuliana@example.com
   Password: [Generate in password manager]
   Auto Confirm User: ✓ YES
   ```
3. Click **Create user**
4. Copy the email address (you'll need it in Step 2)

---

## Step 2: Promote Users (1 minute)

### Open SQL Editor

1. In Supabase Dashboard, click **SQL Editor** (in left menu)
2. Click **New Query**

### Execute Promotion Script

Copy and paste this entire script (replace emails with your real emails):

```sql
-- Promote admin user
SELECT promote_to_admin('your-real-email@example.com');

-- Promote VIP user
SELECT promote_to_vip('giuliana@example.com');

-- Verify both users were promoted
SELECT
  email,
  role,
  is_approved,
  created_at
FROM profiles
WHERE role IN ('admin', 'vip')
ORDER BY role;
```

3. Click **RUN** (or Cmd/Ctrl + Enter)

### Verify Results

You should see output like:

```
email                          | role  | is_approved | created_at
-------------------------------|-------|-------------|-------------------------
your-real-email@example.com    | admin | true        | 2026-01-23 10:30:00
giuliana@example.com           | vip   | true        | 2026-01-23 10:31:00
```

✅ If you see 2 rows with `is_approved = true`, you're done!

---

## Step 3: Test Login (2 minutes)

### Test Admin Login

1. Open your app: http://localhost:3000/login (or your production URL)
2. Enter:
   - Email: `your-real-email@example.com`
   - Password: [the one you generated]
3. Click **Accedi**
4. ✅ **Expected**: Redirect to `/approve-users` (admin dashboard)

### Test VIP Login

1. Open incognito/private window: http://localhost:3000/login
2. Enter:
   - Email: `giuliana@example.com`
   - Password: [the one you generated]
3. Click **Accedi**
4. ✅ **Expected**: Redirect to `/gallery` (VIP gallery view)

---

## Troubleshooting

### Problem: "Invalid login credentials"

**Solution**:
1. Go back to Supabase Dashboard → Authentication → Users
2. Find the user and click the 3 dots → **Reset password**
3. Copy the new password and try again

### Problem: Admin redirected to `/gallery` instead of `/approve-users`

**Solution**: User was not promoted correctly. Run this in SQL Editor:
```sql
SELECT promote_to_admin('your-email@example.com');
```

### Problem: VIP cannot see any content

**Solution**: No content has been approved yet. As admin:
1. Have a test guest upload some content
2. Go to `/approve-content` as admin
3. Approve at least one content item
4. Giuliana should now see it in `/gallery`

### Problem: "Function promote_to_admin does not exist"

**Solution**: Script `003_seed_data.sql` was not executed. Run it:
1. Go to SQL Editor
2. Copy ALL content of `supabase/migrations/003_seed_data.sql`
3. Paste and click RUN

---

## Next Steps

✅ Users created and promoted successfully!

**Now you can**:
1. Share VIP credentials securely with Giuliana (see `docs/CREDENTIALS.md`)
2. Test the full flow: guest register → admin approve → upload → admin approve → VIP view
3. Invite real friends to start uploading content

**For more detailed documentation**:
- Full setup guide: `docs/SUPABASE_SETUP.md`
- Credentials management: `docs/CREDENTIALS.md`
- Admin operations: `CLAUDE.md` (Admin Operations section)

---

## Security Reminders

- ✅ Store all passwords in password manager
- ✅ Never share admin credentials
- ✅ Share VIP credentials securely (encrypted messaging or in person)
- ✅ Never commit real passwords to Git
- ✅ Use strong passwords (12+ characters with letters, numbers, symbols)

---

**Total Time**: ~5 minutes
**Last Updated**: 2026-01-23
