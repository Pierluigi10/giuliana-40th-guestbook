# Deployment Checklist - Giuliana's 40th Birthday Guestbook

Use this checklist before deploying to Vercel. Check off each item to ensure the application is production-ready.

**Deployment Target**: Vercel + Supabase
**Estimated Deploy Time**: 30-45 minutes
**Deadline**: 3 days before birthday (Jan 21, 2026)

---

## Pre-Deployment Phase (Local Machine)

### Code Quality Checks

- [ ] **Build succeeds**
  ```bash
  npm run build
  # Expected: .next folder created, no errors
  # If fails: Fix errors and rebuild
  ```

- [ ] **TypeScript compilation passes**
  ```bash
  npm run type-check
  # Expected: No errors
  # If fails: Fix TypeScript errors in src/
  ```

- [ ] **Linting passes**
  ```bash
  npm run lint
  # Expected: No errors (warnings are OK)
  # If fails: Run npm run lint -- --fix (if auto-fixable)
  ```

- [ ] **All tests pass** (optional but recommended)
  ```bash
  npm run test
  npm run test:e2e
  # Expected: All tests passing
  # If fails: Fix failing tests
  ```

### Code Review

- [ ] **No hardcoded URLs**
  ```bash
  grep -r "localhost\|127.0.0.1\|https://example.com" src/
  # Expected: No matches
  ```

- [ ] **No exposed secrets**
  ```bash
  grep -r "SUPABASE_SERVICE_ROLE_KEY\|secret\|password" src/ | grep -v "process.env"
  # Expected: No hardcoded values (only process.env references)
  ```

- [ ] **Environment variables used correctly**
  ```bash
  grep -r "process.env" src/lib/supabase/
  # Expected: Only NEXT_PUBLIC_* in client.ts, SUPABASE_SERVICE_ROLE_KEY in server.ts
  ```

- [ ] **All sensitive keys in .gitignore**
  - `.env.local` ✓
  - `.env.*.local` ✓
  - `.vercel/` ✓

### Git Repository

- [ ] **Working tree clean**
  ```bash
  git status
  # Expected: "On branch main, nothing to commit, working tree clean"
  ```

- [ ] **Latest main branch**
  ```bash
  git fetch origin main
  git rebase origin/main
  # Expected: "Already up to date" (no new commits to pull)
  ```

- [ ] **No conflicting branches**
  ```bash
  git branch -v
  # Expected: main points to latest commit
  ```

- [ ] **Commits follow convention**
  ```bash
  git log --oneline | head -10
  # Expected: Commits like "feat: ...", "fix: ...", "docs: ..."
  ```

### Supabase Configuration

- [ ] **Database schema deployed**
  - Go to Supabase Dashboard → SQL Editor
  - Verify `profiles`, `content`, `reactions` tables exist
  - Verify columns and data types match `specs/architecture.md`

- [ ] **RLS policies enabled**
  - Supabase Dashboard → SQL Editor
  - Run: `SELECT * FROM pg_policies;`
  - Expected: Policies for each table

- [ ] **Storage buckets created**
  - Supabase Dashboard → Storage
  - Verify `content` bucket exists
  - Bucket is public (if using public URLs)

- [ ] **Auth providers configured**
  - Supabase Dashboard → Authentication → Providers
  - Email/Password enabled ✓

- [ ] **API keys obtained and verified**
  - Supabase Dashboard → Settings → API
  - Copy `NEXT_PUBLIC_SUPABASE_URL` ✓
  - Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
  - Copy `SUPABASE_SERVICE_ROLE_KEY` ✓
  - All 3 values are non-empty and start with correct format

### Local Environment Setup

- [ ] **`.env.local` has valid values**
  ```bash
  cat .env.local
  # Expected output:
  # NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
  # NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  # SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
  # NODE_ENV=development
  ```

- [ ] **Local dev server works**
  ```bash
  npm run dev
  # Expected: "ready - started server on 0.0.0.0:4000"
  # Open http://localhost:4000 and test:
  #   - Page loads within 3 seconds
  #   - No console errors (F12)
  #   - Can navigate to register page
  ```

- [ ] **Local upload/auth flow works**
  - Go to http://localhost:4000/register
  - Create test account
  - Verify email confirmation (if email service enabled)
  - Can upload test content

---

## Vercel Setup Phase

### Create Vercel Account & Project

- [ ] **Vercel account exists**
  - https://vercel.com/signup
  - Verified email ✓

- [ ] **GitHub account connected to Vercel**
  - Vercel Dashboard → Settings → GitHub
  - Repository `pierluigibaiano/g_gift` visible

- [ ] **Project imported to Vercel**
  - Vercel Dashboard → Click "Add New" → "Project"
  - Select `g_gift` repository
  - Framework auto-detected as "Next.js"
  - **Project Name**: `guestbook-app` (or your choice)
  - Click "Import"

### Configure Environment Variables in Vercel

- [ ] **Environment variables added for Production**
  - Vercel Dashboard → Project → Settings → Environment Variables
  - Add for **Production** environment:
    ```
    NEXT_PUBLIC_SUPABASE_URL = https://[project-id].supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
    SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
    NODE_ENV = production
    ```
  - All marked with ✓ Production checkbox

- [ ] **Environment variables added for Preview**
  - Add same variables for **Preview** environment:
    ```
    NEXT_PUBLIC_SUPABASE_URL = https://[project-id].supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
    SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
    NODE_ENV = development
    ```
  - All marked with ✓ Preview checkbox

- [ ] **Verify variables are not exposed**
  - Each variable marked as "Production" or "Preview"
  - `SUPABASE_SERVICE_ROLE_KEY` NOT visible in browser

### Deploy Application

- [ ] **Initial deployment triggered**
  - Option A: Push to main
    ```bash
    git push origin main
    # Vercel auto-deploys within 2 minutes
    ```
  - Option B: Redeploy from dashboard
    - Vercel Dashboard → Deployments tab
    - Click "Redeploy" button on latest deployment

- [ ] **Deployment succeeded**
  - Vercel Dashboard shows green checkmark ✓
  - Status: "Production - Ready"
  - No red X or error messages

- [ ] **Production URL accessible**
  - Vercel shows URL like: `https://guestbook-app.vercel.app`
  - Click link and page loads
  - No 404 or 500 errors

---

## Post-Deployment Verification

### Immediate Checks (Within 5 minutes)

- [ ] **HTTPS working**
  ```bash
  curl -I https://guestbook-app.vercel.app
  # Expected: HTTP/1.1 200 OK
  # Expected: Secure icon in browser
  ```

- [ ] **Security headers present**
  ```bash
  curl -I https://guestbook-app.vercel.app | grep -E "Strict-Transport|X-Frame|X-Content"
  # Expected: All three headers present
  ```

- [ ] **Page loads without errors**
  - Open https://guestbook-app.vercel.app
  - Press F12 (DevTools)
  - Check Console tab
  - No red errors ✓

### Functional Testing

- [ ] **Registration flow works**
  - Click "Register"
  - Fill form with test data
  - Click "Register"
  - See "Pending Approval" message
  - Check Supabase: new user in `profiles` table

- [ ] **Admin dashboard works**
  - Log in as admin account
  - Navigate to `/admin/approve-users`
  - See pending users list
  - Can approve/reject user
  - Navigate to `/admin/approve-content`
  - See pending content

- [ ] **VIP gallery works** (if content approved)
  - Log in as VIP account
  - Navigate to `/gallery`
  - See approved content
  - Can add emoji reactions

- [ ] **Upload works** (as approved guest)
  - After admin approves guest user
  - Guest logs in
  - Navigate to `/upload`
  - Upload test image
  - See "Upload successful" message
  - Check Supabase Storage: file in `content` bucket

### Performance Verification

- [ ] **Page loads fast**
  - Open production URL
  - Refresh page (Ctrl+Shift+R for hard refresh)
  - Should load within 3 seconds
  - Core Web Vitals should be green

- [ ] **Lighthouse score > 80**
  - DevTools → Lighthouse tab
  - Click "Analyze page load"
  - Performance: > 80 ✓
  - Accessibility: > 90 ✓
  - Best Practices: > 90 ✓

- [ ] **Mobile responsive**
  - DevTools → Device emulation (Ctrl+Shift+M)
  - Test iPhone 12, iPhone SE, Galaxy S20
  - Layout responsive, no horizontal scroll
  - Buttons clickable, no overlap

### Database Verification

- [ ] **Supabase connection working**
  - Production URL shows real data
  - User registration creates database records
  - Upload creates content records

- [ ] **Storage working**
  - Supabase Dashboard → Storage
  - `content` bucket has files from test uploads

- [ ] **RLS policies enforced**
  - Only authenticated users can view own profile
  - Only approved content visible to VIP
  - Admin can see all users/content

### Security Verification

- [ ] **Secrets not exposed**
  - View page source (Ctrl+U)
  - `SUPABASE_SERVICE_ROLE_KEY` NOT in HTML
  - Only `NEXT_PUBLIC_*` variables may appear

- [ ] **Authentication working**
  - Can log in with valid credentials
  - Cannot log in with invalid credentials
  - Session persists after page refresh

- [ ] **Authorization enforced**
  - Guest cannot access `/admin` routes
  - Guest cannot access `/gallery` (VIP only)
  - VIP cannot access `/admin`

---

## Cross-Browser & Device Testing

### Browsers (Latest 2 Versions)

- [ ] **Chrome/Chromium**
  - Desktop: Latest version
  - Mobile: Android Chrome latest
  - No console errors ✓

- [ ] **Safari**
  - Desktop: macOS Safari latest
  - Mobile: iOS Safari latest (on iPhone)
  - No console errors ✓

- [ ] **Firefox**
  - Desktop: Latest version
  - Mobile: Android Firefox latest
  - No console errors ✓

### Mobile Devices

- [ ] **iOS**
  - iPhone 12 or later
  - All pages responsive
  - Upload works on mobile

- [ ] **Android**
  - Android 12 or later
  - All pages responsive
  - Upload works on mobile

### Network Conditions

- [ ] **Slow 4G**
  - DevTools → Network tab
  - Set throttle to "Slow 4G"
  - Page still loads, no timeout

- [ ] **Offline**
  - DevTools → Network → Offline
  - Shows appropriate error message

---

## Post-Deploy Documentation

### Update Documentation

- [ ] **README.md updated with production URL**
  - Production URL: `https://guestbook-app.vercel.app`
  - Or custom domain: `https://your-domain.com`

- [ ] **Share deployment with team**
  - Email/Slack message with:
    - Production URL
    - Test account credentials (if applicable)
    - Link to DEPLOYMENT.md guide

- [ ] **Monitor deployment**
  - Set calendar reminder to check analytics daily
  - Monitor error rates, response times
  - Check Supabase storage usage

### Rollback Plan Ready

- [ ] **Know how to rollback**
  - If critical bug: Click "Redeploy" on previous deployment
  - Or use `git revert` and push to main
  - Timeline: 2-3 minutes

- [ ] **Backup procedures documented**
  - Supabase auto-backups enabled
  - Database export procedure known

---

## Final Sign-Off

### Pre-Deployment Sign-Off (Before Pushing to Vercel)

- [ ] **All checks above completed** ✓
- [ ] **Code reviewed** ✓
- [ ] **Tests passing** ✓
- [ ] **Ready to deploy** ✓

**Date/Time**: _______________
**Deployed By**: _______________

### Post-Deployment Sign-Off (After 1 Hour Monitoring)

- [ ] **Deployment successful** ✓
- [ ] **No critical errors** ✓
- [ ] **All core features working** ✓
- [ ] **Performance acceptable** ✓
- [ ] **Ready for users** ✓

**Date/Time**: _______________
**Verified By**: _______________

---

## Quick Reference: Common Commands

### Before Deploy
```bash
npm run build && npm run type-check && npm run lint
git status  # must show "clean"
git push origin main  # triggers Vercel deployment
```

### Check Deployment
```bash
# Vercel Dashboard
https://vercel.com/dashboard

# Production URL
https://guestbook-app.vercel.app

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

---

## Troubleshooting During Deployment

### Deployment Failed

**Check build logs**:
- Vercel Dashboard → Deployments tab
- Click failed deployment
- Click "Logs" tab
- Search for "error" keyword

**Common issues**:
1. TypeScript compilation error → Fix locally with `npm run type-check`
2. Missing environment variable → Add to Vercel dashboard
3. Dependency not found → Run `npm install` locally, commit package-lock.json

### Page Shows 404

- Check production URL is correct
- Vercel deployment shows green checkmark?
- Wait 2-3 minutes for deployment to fully complete
- Hard refresh browser (Ctrl+Shift+R)

### Database Connection Error

- Verify Supabase project is active (not paused)
- Check environment variables in Vercel are correct
- Test database: `curl https://[your-project].supabase.co/`
- Should return valid response (not error)

### Uploads Failing

- Check Storage bucket exists in Supabase
- Verify bucket permissions (should be public)
- Check file size < 10 MB
- Look at browser Console (F12) for error message

---

**Document Version**: 1.0
**Last Updated**: January 23, 2026
**Next Review**: After deployment
