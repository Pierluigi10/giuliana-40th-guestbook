# Deployment Checklist - Giuliana's 40th Birthday Guestbook

## Critical Timeline

**Important:** Deploy 3 days before the birthday, feature freeze 2 days before.

## Pre-Deployment Verification

### 1. Build and Type Check

- [ ] Run `npm run type-check` - must complete without TypeScript errors
- [ ] Run `npm run build` - must complete without errors
- [ ] Run `npm run lint` - check for warnings/errors
- [ ] Test in development mode: `npm run dev` - no console errors

**Automated script:** Run `./scripts/pre-deploy-check.sh` to verify automatically

### 2. Database Setup on Supabase

- [ ] All migrations executed correctly:
  - [ ] `001_initial_schema.sql` - users, content, reactions tables
  - [ ] `002_rls_policies.sql` - RLS policies for security
  - [ ] `003_seed_data.sql` - initial data
- [ ] Admin user created (Pierluigi):
  - Email: _________________
  - Role: `admin`
  - Status: `approved`
- [ ] VIP user created (Giuliana):
  - Email: _________________
  - Role: `vip`
  - Status: `approved`
- [ ] Storage bucket `content-files` created
- [ ] Storage policies configured (see migration 002)

**How to verify:**
```sql
-- Check users
SELECT id, email, role, status FROM profiles;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'content-files';

-- Test RLS policies
-- Try to access as unapproved guest (should fail)
```

### 3. Environment Variables on Vercel

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
  - Value: `https://[project-id].supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
  - Find it in: Supabase Dashboard > Settings > API > anon public
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
  - Find it in: Supabase Dashboard > Settings > API > service_role
  - **WARNING:** This key must NEVER be exposed to the client

**How to configure on Vercel:**
1. Go to dashboard.vercel.com
2. Select the project
3. Settings > Environment Variables
4. Add the 3 variables above
5. Redeploy the project

### 4. Security Tests

- [ ] XSS Protection tested:
  - Try inserting `<script>alert('test')</script>` in a message
  - Must be sanitized (no popup)
- [ ] RLS Policies tested:
  - Unapproved guest user CANNOT see VIP gallery
  - Guest user CANNOT approve content
  - VIP user CANNOT see unapproved content
- [ ] File upload limits:
  - Files > 10MB must be rejected
  - Only images (jpg, png, gif) and videos (mp4, mov) accepted
- [ ] Rate limiting tested:
  - Cannot upload more than 1 content per minute

**Manual RLS test:**
```javascript
// Try to read unapproved content as VIP
// Must return 0 results
const { data } = await supabase
  .from('content')
  .select('*')
  .eq('status', 'pending');
```

### 5. E2E Manual Test (Complete Flow)

**Guest Flow:**
- [ ] New guest registration
  - Go to `/register`
  - Fill form with email/password
  - Verify redirect to `/pending-approval`
- [ ] Admin approval
  - Login as admin on `/login`
  - Go to `/approve-users`
  - Approve the newly registered guest
- [ ] Approved guest login
  - Logout admin
  - Login as guest on `/login`
  - Verify redirect to `/upload`
- [ ] Content upload
  - Upload text + photo
  - Verify upload progress bar
  - Confirm success message
- [ ] Admin moderation
  - Login as admin
  - Go to `/approve-content`
  - Approve the newly uploaded content

**VIP Flow:**
- [ ] VIP login
  - Login as Giuliana on `/login`
  - Verify redirect to `/gallery`
- [ ] Gallery view
  - Verify only approved content appears
  - Test filters (All/Text/Photo/Video)
  - Test emoji reaction buttons
  - Click on photo > verify lightbox
  - Click on video > verify playback

**Admin Flow:**
- [ ] Admin dashboard
  - Go to `/approve-users`
  - Verify pending users list
  - Test bulk approval (if implemented)
- [ ] Content moderation
  - Go to `/approve-content`
  - Verify content preview
  - Test approve/reject

### 6. Mobile Test

- [ ] iPhone Safari
  - Registration works
  - Photo upload works (camera picker)
  - Gallery responsive
  - Reactions clickable
- [ ] Android Chrome
  - Same tests as iPhone
- [ ] Responsive layout
  - Test breakpoints: 320px, 375px, 768px, 1024px
  - Hamburger menu on mobile
  - Forms readable on small screens

**Emulators:**
- Chrome DevTools > Toggle device toolbar
- Test: iPhone SE, iPhone 14 Pro, iPad, Samsung Galaxy S21

### 7. Performance Check

- [ ] Lighthouse test (Chrome DevTools)
  - Performance > 80 (mobile and desktop)
  - Accessibility > 90
  - Best Practices > 90
  - SEO > 90
- [ ] Lazy loading works
  - Images load on-scroll
  - Videos don't autoplay (saves bandwidth)
- [ ] Acceptable bundle size
  - Run `npm run build`
  - Check output: First Load JS < 200kB

**How to run Lighthouse:**
1. Open Chrome DevTools (F12)
2. "Lighthouse" tab
3. Select "Mobile" + "Performance"
4. Click "Analyze page load"

### 8. Cross-Browser Test

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

**Critical features to test:**
- Login/Logout
- File upload
- Gallery view
- Reactions

### 9. Storage and Limits

- [ ] Supabase storage verified
  - Free tier: 500MB
  - Check usage: Supabase Dashboard > Storage > Usage
- [ ] Image compression active
  - Uploaded files must be compressed client-side (if implemented)
- [ ] Monitoring configured
  - Configure alert on Supabase if storage > 400MB

### 10. Deployment on Vercel

- [ ] GitHub repository updated
  ```bash
  git add .
  git commit -m "chore: pre-deployment final checks"
  git push origin main
  ```
- [ ] Vercel auto-deploy completed
  - Go to dashboard.vercel.com
  - Verify deployment status: "Ready"
  - Deploy time < 5 minutes
- [ ] Production URL accessible
  - Visit `https://[project-name].vercel.app`
  - Homepage loads correctly
- [ ] All functionality tested in production
  - Repeat manual E2E tests in production
  - Verify env variables loaded

**Deploy troubleshooting:**
- If deploy fails: check logs on Vercel
- Common errors: missing env variables, TypeScript build errors

### 11. Post-Deployment Verification

- [ ] Create test users
  - 2-3 test guest users
  - Upload 5-10 test content items
- [ ] Test notifications (if implemented)
  - Email notifications work
- [ ] Document admin credentials
  - Save admin email/password in password manager
  - Share registration link with first friends
- [ ] Prepare user guides
  - Send registration instructions to invitees
  - Prepare FAQ for common questions

### 12. Monitoring and Backup

- [ ] Configure Vercel monitoring
  - Analytics enabled
  - Error tracking active
- [ ] Database backup
  - Export Supabase schema
  - Save migrations in repository
- [ ] Rollback plan tested
  ```bash
  # In case of emergency
  git revert HEAD
  git push origin main
  # Vercel redeploys automatically
  ```

## Final Checklist (T-3 days)

- [ ] All tests above completed
- [ ] Admin and VIP users created
- [ ] Environment variables configured
- [ ] Production deployment completed
- [ ] E2E tests in production passed
- [ ] Registration link shared with 2-3 beta tester friends

## Feature Freeze (T-2 days)

**After this date: ONLY critical bugfixes, NO new features**

- [ ] Feature freeze communicated to team (Pierluigi)
- [ ] Last changes merged
- [ ] Database backup completed
- [ ] Monitoring active

## D-Day Preparation (T-1 day)

- [ ] Verify available storage
- [ ] Check number of registered users
- [ ] Test gallery with real content
- [ ] Verify performance with expected load
- [ ] Prepare emergency plan

## Emergency Contacts

**Technical Support:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Next.js Discord: https://nextjs.org/discord

**Documentation:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

## Rollback Plan

**If you find critical bugs in production:**

1. **Immediate rollback:**
   ```bash
   git log --oneline  # Find previous commit ID
   git revert HEAD    # Revert last commit
   git push origin main
   ```
   Vercel redeploys automatically in ~3 minutes

2. **Hotfix:**
   ```bash
   git checkout -b hotfix/critical-bug
   # Fix bug
   git commit -m "fix: resolve critical bug"
   git checkout main
   git merge hotfix/critical-bug
   git push origin main
   ```

3. **User notifications:**
   - If downtime needed, notify users via email/SMS
   - Prepare message: "Temporary maintenance, we'll be back soon"

## Known Issues and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Storage full (500MB) | Medium | High | Image compression, 10MB limit, monitoring |
| Bulk uploads pre-event | High | Medium | Rate limiting 1/min, user guide |
| Critical bug pre-event | Low | Critical | Deploy T-3, feature freeze T-2 |
| Admin approval delays | Medium | Medium | Email notifications, mobile-friendly dashboard |
| Database crash | Very low | Critical | Daily backups, RLS policies tested |

## Success Metrics

**Target:**
- 30+ friends registered
- 50+ content items uploaded
- 0 critical bugs
- Lighthouse Performance > 80
- 100% uptime during event

**Monitoring:**
- Vercel Analytics Dashboard
- Supabase Dashboard > Database > Statistics
- Google Analytics (if implemented)

## Quick Reference: Common Commands

### Before Deploy
```bash
npm run build && npm run type-check && npm run lint
git status  # must show "clean"
git push origin main  # trigger Vercel deployment
```

### Check Deployment
```bash
# Vercel Dashboard
https://vercel.com/dashboard

# Production URL
https://[your-project].vercel.app

# Supabase Dashboard
https://supabase.com/dashboard
```

### Rollback
```bash
# Via Vercel dashboard: Click "Redeploy" on previous deployment
# Via Git: git revert HEAD && git push origin main
```

### View Logs
```bash
# Vercel deployment logs: Dashboard → Deployments → Click deployment
# Supabase database logs: Dashboard → Logs
```

## Notes

- **Don't deploy on the birthday** - too risky
- Test everything in production, don't trust only local/staging
- Stay calm: rollback is fast (3 minutes)
- Backup database before every critical migration

---

**Completed by:** ___________________
**Date:** ___________________
**Deployment completed:** ___________________
**Production URL:** ___________________
