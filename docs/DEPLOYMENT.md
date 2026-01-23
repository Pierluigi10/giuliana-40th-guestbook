# Deployment Guide - Giuliana's 40th Birthday Guestbook

**Deploy Target**: Vercel (frontend) + Supabase Cloud (backend)
**Estimated Time**: 30-45 minutes
**Production URL**: TBD (customize domain after deployment)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Environment Configuration](#environment-configuration)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Preview Deployments (Dev Branch)](#preview-deployments-dev-branch)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedure](#rollback-procedure)

---

## Prerequisites

### Account & Access
- [x] Vercel account created (vercel.com)
- [x] GitHub account with push access to `https://github.com/pierluigibaiano/g_gift`
- [x] Supabase project created and configured (https://supabase.com/dashboard)
- [x] Admin access to Supabase project settings

### Local Setup
- [x] Node.js 18+ installed (`node --version` → v18.0.0+)
- [x] npm or yarn package manager
- [x] Git installed and configured
- [x] `.env.local` file exists with valid Supabase credentials (for local testing)

### Code Requirements
- [x] All tests passing locally: `npm run test && npm run test:e2e`
- [x] TypeScript compilation successful: `npm run type-check`
- [x] Build successful locally: `npm run build`
- [x] No linting errors: `npm run lint`
- [x] Main branch is up-to-date: `git status` shows "clean"

### Supabase Configuration
- [x] Database schema deployed: `supabase/migrations/001_initial_schema.sql`
- [x] RLS policies enabled on all tables
- [x] Storage buckets created: `content`, `avatars` (if applicable)
- [x] Auth providers configured (Email/Password at minimum)
- [x] Project URL and keys obtained

---

## Pre-Deployment Checklist

```bash
# 1. Verify local build
npm run build
# Expected: .next folder created, no errors

# 2. Type checking
npm run type-check
# Expected: TypeScript compilation successful

# 3. Linting
npm run lint
# Expected: No errors (warnings OK)

# 4. Tests (optional but recommended)
npm run test
npm run test:e2e
# Expected: All tests passing

# 5. No uncommitted changes
git status
# Expected: "On branch main, nothing to commit, working tree clean"

# 6. Pull latest main
git fetch origin main
git rebase origin/main
# Expected: Already up to date

# 7. Verify environment variables locally
cat .env.local | grep NEXT_PUBLIC_SUPABASE
# Expected: Two lines with valid values (not placeholders)
```

### Verification Commands

Run this before deployment:

```bash
#!/bin/bash
set -e  # Exit on any error

echo "🔍 Pre-deployment verification..."

# 1. Build check
echo "  → Building application..."
npm run build > /dev/null 2>&1

# 2. Type check
echo "  → Checking TypeScript..."
npm run type-check > /dev/null 2>&1

# 3. Linting
echo "  → Linting code..."
npm run lint > /dev/null 2>&1

# 4. Git status
echo "  → Checking git status..."
if ! git diff-index --quiet HEAD --; then
  echo "    ⚠️  Uncommitted changes detected!"
  exit 1
fi

# 5. Environment variables
echo "  → Verifying environment variables..."
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
  echo "    ⚠️  Invalid or missing NEXT_PUBLIC_SUPABASE_URL"
  exit 1
fi

echo "✅ All checks passed! Ready for deployment."
```

---

## Step-by-Step Deployment

### Phase 1: Connect Repository to Vercel

#### Option A: Using Vercel Dashboard (Recommended for First-Time Users)

1. **Visit Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Sign in with GitHub account (or email)

2. **Import Project**
   - Click "Add New" → "Project"
   - Select "Import Git Repository"
   - Search for `g_gift` repository
   - Click "Import"

3. **Configure Project**
   - **Project Name**: `guestbook-app` (or your choice)
   - **Framework Preset**: "Next.js" (auto-detected)
   - **Root Directory**: `.` (default is correct)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

#### Option B: Using Vercel CLI

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Deploy from project root
cd /Users/pierluigibaiano/Development/g_gift
vercel

# 3. Answer prompts:
# - "Set up and deploy ~/Development/g_gift?" → Yes (y)
# - "Which scope?" → Your account
# - "Link to existing project?" → No (first deployment)
# - "What's your project's name?" → guestbook-app
# - "In which directory is your code?" → ./ (current directory)
# - "Want to modify these settings?" → No

# 4. Deployment begins automatically
```

### Phase 2: Configure Environment Variables

#### In Vercel Dashboard

1. **Navigate to Project Settings**
   - Go to https://vercel.com/dashboard
   - Click on your project (`guestbook-app`)
   - Click "Settings" tab

2. **Add Environment Variables**
   - Click "Environment Variables" in left sidebar
   - For each variable below, click "Add New":

   **Production Environment** (`Production` checkbox checked):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   Value: https://[your-project-id].supabase.co
   ✓ Production

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGc... (your anon key from Supabase)
   ✓ Production

   SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGc... (your service role key)
   ✓ Production

   NODE_ENV
   Value: production
   ✓ Production
   ```

   **Preview Environment** (`Preview` checkbox checked):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   Value: https://[your-project-id].supabase.co
   ✓ Preview

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGc...
   ✓ Preview

   SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGc...
   ✓ Preview

   NODE_ENV
   Value: development
   ✓ Preview
   ```

3. **Verify Variables**
   - All variables should show in the list
   - Check "Production" column for Production vars
   - Check "Preview" column for Preview vars

#### Via Vercel CLI

```bash
# Set environment variables for production
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://[your-project-id].supabase.co
# Select: Production

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGc...
# Select: Production

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGc...
# Select: Production

vercel env add NODE_ENV
# Paste: production
# Select: Production
```

### Phase 3: Deploy Application

#### Via Dashboard

1. **Navigate to Deployments**
   - Go to your project in Vercel dashboard
   - Click "Deployments" tab

2. **Trigger Deployment**
   - Option A: Push to `main` branch
     ```bash
     git push origin main
     ```
     Vercel will auto-deploy within 1-2 minutes

   - Option B: Redeploy from dashboard
     - Click the latest deployment
     - Click "Redeploy" button

#### Via CLI

```bash
# Deploy to production
vercel --prod

# Answer prompts if first time:
# "Set up and deploy ~/Development/g_gift?" → Yes
# "Which scope?" → Your account
# "Link to existing project?" → Yes (select existing project)
# "Set up source code from git?" → No (already linked)

# Wait for deployment to complete
# Output will show production URL like: https://guestbook-app.vercel.app
```

### Phase 4: Monitor Deployment

1. **Watch Deployment Progress**
   - Dashboard shows real-time build logs
   - Green checkmark = deployment successful
   - Red X = deployment failed (check logs below)

2. **Check Build Logs**
   - Click on deployment in "Deployments" tab
   - View "Build Logs" for any errors
   - Common issues:
     - Missing environment variables
     - TypeScript compilation errors
     - Dependency resolution failures

3. **Expected Output**
   ```
   ✓ Requested resources have finished deploying

   Deployment complete!
   Your production URL: https://guestbook-app.vercel.app
   Inspect: https://vercel.com/pierluigibaiano/guestbook-app/...
   ```

---

## Post-Deployment Verification

### Immediate Checks (Within 5 minutes)

```bash
# 1. Check deployment URL
curl -I https://guestbook-app.vercel.app
# Expected: HTTP/1.1 200 OK, Content-Type: text/html

# 2. Test API endpoint (if created)
curl https://guestbook-app.vercel.app/api/health
# Expected: { "status": "ok" }

# 3. Monitor real user request (RUM)
# Check Vercel dashboard → Analytics tab
```

### Functional Verification

1. **Navigate to Production URL**
   - Go to `https://guestbook-app.vercel.app` (or your custom domain)
   - Page should load within 3 seconds
   - No console errors (press F12)

2. **Test Authentication Flow**
   - Click "Register" link
   - Create test account with valid email
   - Verify email confirmation email received
   - Log in with credentials
   - Should see "Pending Approval" message

3. **Test Upload Flow** (as test guest user after approval)
   - Upload test image/text/video
   - Should complete without errors
   - Check Supabase Storage: files should appear in `content` bucket

4. **Test Admin Dashboard**
   - Log in as admin account (configured in Supabase)
   - Navigate to `/admin/approve-users`
   - Should see pending users list
   - Navigate to `/admin/approve-content`
   - Should see pending content

5. **Test VIP Gallery** (as Giuliana/VIP user)
   - Log in as VIP account
   - Navigate to `/gallery`
   - Should see only approved content
   - Emoji reactions should work

### Performance Checks

1. **Lighthouse Audit**
   ```bash
   # Use Chrome DevTools:
   # 1. Press F12
   # 2. Click "Lighthouse" tab
   # 3. Click "Analyze page load"
   ```
   Expected scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

2. **Check Vercel Analytics**
   - Dashboard → Analytics tab
   - Monitor:
     - Response times (should be < 1s)
     - Error rate (should be 0%)
     - Bandwidth usage

### Security Verification

1. **Check Security Headers**
   ```bash
   curl -I https://guestbook-app.vercel.app | grep -E "Strict-Transport|X-Frame|X-Content-Type"
   ```
   Expected output:
   ```
   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   ```

2. **Verify Environment Variables Not Exposed**
   - Check source code (View Page Source - Ctrl+U)
   - `SUPABASE_SERVICE_ROLE_KEY` should NOT appear
   - Only `NEXT_PUBLIC_*` variables may appear in HTML

3. **Test CORS** (if applicable)
   ```bash
   curl -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS https://guestbook-app.vercel.app/api/content
   ```

### Database Verification

1. **Check Supabase Connection**
   - Vercel Dashboard → Project Settings → Environment Variables
   - Confirm all three Supabase variables are set

2. **Monitor Database**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click "Editor" tab
   - Verify tables exist and have schema
   - Check RLS policies are enabled

3. **Test Database Operations**
   - Attempt user registration (writes to `profiles` table)
   - Attempt content upload (writes to `content` table)
   - Check Supabase Editor for new records

---

## Environment Configuration

### Required Environment Variables

| Variable | Type | Source | Example | Notes |
|----------|------|--------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase Dashboard | `https://abc123.supabase.co` | Safe in browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase Dashboard | `eyJhbGciOi...` | Safe in browser, for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase Dashboard | `eyJhbGciOi...` | **NEVER expose to browser** |
| `NODE_ENV` | Public | Set by Vercel | `production` | Auto-set, but verify |

### How to Get Supabase Credentials

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Click your project

2. **Navigate to API Settings**
   - Click "Settings" → "API"

3. **Copy Values**
   - **Project URL**: Copy this as `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key**: Copy as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: Copy as `SUPABASE_SERVICE_ROLE_KEY`

4. **Verify Keys Format**
   - URLs: `https://[project-id].supabase.co`
   - Keys: Start with `eyJh...` (Base64 encoded JWT)

### Setting Variables in Vercel

#### Method 1: Dashboard UI
1. Project → Settings → Environment Variables
2. Click "Add New"
3. Enter variable name and value
4. Select environments (Production/Preview/Development)
5. Click "Save"

#### Method 2: Vercel CLI
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter value and select environments when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### Method 3: .env.production File (Not Recommended)
```bash
# Create .env.production locally (DO NOT commit to git)
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NODE_ENV=production
```

**⚠️ IMPORTANT**: Never commit `.env.production` to Git. Add to `.gitignore` if created.

---

## Custom Domain Setup

### Prerequisites
- [x] Domain purchased (e.g., guestbook.example.com)
- [x] Domain registrar access (GoDaddy, Namecheap, etc.)
- [x] Project deployed on Vercel (gets default vercel.app domain first)

### Option A: Vercel-Managed DNS (Recommended)

1. **Connect Domain to Vercel**
   - Project → Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `guestbook.example.com`)

2. **Update Nameservers at Registrar**
   - Vercel shows 4 nameservers to use
   - Go to your domain registrar
   - Replace current nameservers with Vercel's:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ns3.vercel-dns.com
     ns4.vercel-dns.com
     ```
   - Wait 24-48 hours for DNS propagation

3. **Verify Domain**
   - After propagation, Vercel shows green checkmark
   - Visit your custom domain
   - HTTPS certificate auto-issued

### Option B: Custom Nameservers (Existing DNS)

If you manage DNS elsewhere (CloudFlare, Route53, etc.):

1. **Add Domain to Vercel**
   - Project → Settings → Domains
   - Click "Add Domain"
   - Choose "External DNS" option

2. **Add DNS Records**
   - A Record: `guestbook.example.com` → Vercel IP
   - CNAME Record: `www.guestbook.example.com` → `cname.vercel-dns.com`
   - See Vercel dashboard for exact values

3. **Update DNS Provider**
   - Go to your DNS provider (CloudFlare, Route53, etc.)
   - Add the A and CNAME records provided by Vercel
   - Wait for DNS propagation

### SSL/TLS Certificate

- **Automatic**: Vercel auto-issues free SSL cert from Let's Encrypt
- **Timeline**: Usually 2-5 minutes after DNS verification
- **Verification**: HTTPS works on custom domain automatically

### Testing Custom Domain

```bash
# Test DNS resolution
nslookup guestbook.example.com
# Should return Vercel IP address

# Test HTTPS
curl -I https://guestbook.example.com
# Expected: HTTP/1.1 200 OK
# Expected: Strict-Transport-Security header

# Test in browser
# Visit: https://guestbook.example.com
# Should load your app
```

---

## Preview Deployments (Dev Branch)

Preview deployments allow testing changes before merging to `main`.

### Setup Preview Deployments

#### 1. Enable Git Branch Deployments

- Project → Settings → Git
- **Framework**: Next.js (auto-detected)
- **Build & Development Settings**:
  - **Build Command**: `npm run build`
  - **Install Command**: `npm ci` or `npm install`
  - **Development Command**: `npm run dev`
  - **Output Directory**: `.next`

#### 2. Create Dev Branch

```bash
# Create dev branch if not exists
git checkout -b dev
git push -u origin dev
```

#### 3. Configure Preview Environment Variables

- Project → Settings → Environment Variables
- For each variable, set environment to "Preview":
  - `NEXT_PUBLIC_SUPABASE_URL` ✓ Preview
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓ Preview
  - `SUPABASE_SERVICE_ROLE_KEY` ✓ Preview
  - `NODE_ENV` = `development` ✓ Preview

### Creating Feature Branches

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feat/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push -u origin feat/my-feature

# 4. Create Pull Request
# Go to GitHub → Create PR from feat/my-feature to dev
```

### Vercel Automatically Creates Preview Deployment

- For each PR/branch, Vercel creates unique preview URL:
  ```
  https://guestbook-app-feat-my-feature.vercel.app
  ```

- **View Preview Deployment**:
  - GitHub PR page → "Deployments" section
  - Click "Visit deployment" link
  - Or check Vercel dashboard → Deployments tab

### Testing Preview Deployment

1. **Functional Testing**
   - Test all changes on preview URL
   - Try all user flows

2. **Performance Check**
   - Lighthouse audit on preview
   - Check response times

3. **Approve PR**
   - If satisfied, approve and merge PR
   - Merge `dev` → `main` for production deployment
   - Or merge PR directly to main for hotfix

### Merging to Production

```bash
# Option A: Via GitHub UI
# 1. Go to PR on GitHub
# 2. Click "Merge pull request"
# 3. Select merge strategy (Squash/Rebase/Merge commit)
# 4. Confirm

# Option B: Via Git CLI
git checkout main
git pull origin main
git merge --no-ff dev  # or feat/branch
git push origin main
# Vercel auto-deploys to production
```

---

## Troubleshooting

### Deployment Failed

#### Symptom: Build Error in Vercel Dashboard

**Error**: `npm ERR! code ERESOLVE`

**Solution**:
```bash
# Locally, regenerate lock file
rm package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate lock file"
git push origin main
# Redeploy from Vercel
```

---

#### Symptom: Missing Environment Variable

**Error in logs**: `SyntaxError: Cannot destructure property 'NEXT_PUBLIC_SUPABASE_URL' of 'process.env' as it is undefined`

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Verify all three Supabase variables are present
3. Check "Production" checkbox is selected for production deployment
4. Click "Redeploy" on latest deployment

---

#### Symptom: TypeScript Compilation Error

**Error**: `error TS2307: Cannot find module '@/types/database'`

**Solution**:
```bash
# Locally, regenerate TypeScript:
npm run type-check  # See local errors first

# If tsconfig.json issue:
# Verify paths section in tsconfig.json points to ./src/*
```

---

### Application Deployed But Not Working

#### Symptom: 500 Internal Server Error

**Check**:
1. Vercel Dashboard → Deployments → Logs tab
2. Look for error messages
3. Common causes:
   - Supabase connection failed
   - Environment variables incorrect
   - Database schema not initialized

**Solution**:
```bash
# 1. Verify Supabase project is active
# Go to https://supabase.com/dashboard

# 2. Test database connection locally
npm run dev
# Try login/upload locally

# 3. Check Supabase logs
# Supabase Dashboard → Logs tab → Edge Functions
```

---

#### Symptom: Styling Missing (Page Looks Broken)

**Cause**: CSS not loaded

**Solution**:
1. Check Vercel build logs for Tailwind errors
2. Verify `tailwind.config.ts` exists
3. Rebuild:
   ```bash
   git commit --allow-empty -m "chore: rebuild"
   git push origin main
   ```

---

#### Symptom: Authentication Not Working

**Error**: "Unable to connect to Supabase"

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
2. Check if Supabase project is active (not paused)
3. Test locally:
   ```bash
   curl https://abc123.supabase.co/
   # Should return 404 (Supabase is running)
   ```

---

### Performance Issues

#### Symptom: Page Loading Slow (> 3 seconds)

**Check**:
1. Vercel Dashboard → Analytics → Response Time
2. Lighthouse audit → Performance score

**Solution**:
- Enable image optimization in `next.config.js` (already done)
- Use `next/image` for all images
- Check database query performance
- Consider Vercel's serverless function optimization

---

### Database Issues

#### Symptom: Cannot Connect to Database

**Check**:
1. Supabase project status: https://supabase.com/dashboard
2. RLS policies enabled: Project → Authentication → Policies

**Solution**:
- Ensure RLS policies allow read/write for authenticated users
- Check Supabase logs for query errors

---

## Rollback Procedure

### If Deployment Has Critical Bug

#### Option 1: Quick Rollback (via Vercel Dashboard)

1. Go to Vercel Dashboard → Deployments tab
2. Find the previous good deployment
3. Click on it
4. Click "Promote to Production" button
5. Confirm

**Timeline**: 2-3 minutes

---

#### Option 2: Code Rollback (via Git)

```bash
# 1. Find last good commit
git log --oneline | head -10

# 2. Revert to previous commit
git revert HEAD  # Creates new commit that undoes changes
# OR
git reset --hard <commit-hash>  # Dangerous: rewrites history

# 3. Push to main
git push origin main

# 4. Vercel auto-deploys new version
```

---

#### Option 3: Emergency Fix (Hotfix)

```bash
# 1. If urgent, create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Apply fix
# ... edit files ...

# 3. Commit and push
git commit -m "fix: critical production issue"
git push -u origin hotfix/critical-issue

# 4. Create PR and merge to main immediately
# Vercel auto-deploys
```

---

### Monitoring Post-Rollback

- Check Vercel Analytics for error rates (should drop to 0%)
- Verify application functionality
- Check Supabase logs

---

## Post-Deployment Operations

### Weekly Monitoring Checklist

- [ ] Check Vercel Analytics → no spike in error rates
- [ ] Check Lighthouse scores → maintain > 80
- [ ] Review bandwidth usage → within free tier limits
- [ ] Check Supabase storage usage → < 500 MB
- [ ] Verify no broken links (use online tool)
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

### Scaling Considerations

#### If Database Gets Full (> 500 MB)

- Supabase free tier limit: 500 MB
- Solution: Upgrade to Pro ($25/month) or compress old content

#### If Traffic Spikes

- Vercel handles auto-scaling (serverless functions scale automatically)
- Monitor bandwidth usage
- Consider CDN caching if needed

### Maintenance Windows

- Schedule updates during low-traffic times
- Always test in preview deployment first
- Communicate outages to users beforehand

---

## Contact & Support

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Documentation**: https://vercel.com/docs, https://supabase.com/docs

---

**Last Updated**: January 2026
**Version**: 1.0
**Author**: Pierluigi Baiano
