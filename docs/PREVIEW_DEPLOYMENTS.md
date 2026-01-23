# Preview Deployments Configuration

Guide for setting up preview deployments for the `dev` branch in Vercel.

---

## Overview

Preview deployments allow testing changes on a temporary URL before merging to production.

**Workflow**:
1. Create feature branch from `dev`
2. Push to GitHub
3. Create Pull Request to `dev`
4. Vercel creates preview URL automatically
5. Test on preview URL
6. Merge PR if satisfied
7. Merge `dev` → `main` for production

---

## Quick Setup

### 1. Create Dev Branch (if not exists)

```bash
# Create dev branch
git checkout -b dev

# Set up tracking branch
git push -u origin dev
```

### 2. Configure Vercel Git Settings

**In Vercel Dashboard**:

1. Project → Settings → Git
2. **Build & Development Settings**:
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `npm run build`
   - **Install Command**: `npm ci` or `npm install`
   - **Output Directory**: `.next`
   - **Development Command**: `npm run dev`
   - Click "Save"

3. **Git Configuration**:
   - **Production branch**: `main`
   - **Include source maps in production builds**: Off
   - Ignore Build Step: Leave empty

### 3. Set Preview Environment Variables

**In Vercel Dashboard**:

1. Project → Settings → Environment Variables

2. For each variable, set environment to **Preview**:
   - `NEXT_PUBLIC_SUPABASE_URL` ✓ Preview ✓ Development
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓ Preview ✓ Development
   - `SUPABASE_SERVICE_ROLE_KEY` ✓ Preview ✓ Development
   - `NODE_ENV` = `development` ✓ Preview ✓ Development

**Important**: Same values as production for Supabase (they're all the same environment)

---

## Creating Feature Branches

### 1. Create Feature Branch from Dev

```bash
# Ensure dev branch is up to date
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feat/feature-name
# or
git checkout -b fix/bug-name
# or
git checkout -b chore/maintenance-task

# Push to GitHub
git push -u origin feat/feature-name
```

### 2. Make Changes

```bash
# Edit files
code src/components/MyComponent.tsx

# Test locally
npm run dev
# Open http://localhost:4000

# Commit changes
git add src/components/MyComponent.tsx
git commit -m "feat: add new component"

# Push commits
git push origin feat/feature-name
```

### 3. Create Pull Request

**Via GitHub UI**:
1. Go to https://github.com/pierluigibaiano/g_gift
2. Click "Pull requests" tab
3. Click "New pull request" button
4. **Base**: `dev` (not `main`)
5. **Compare**: `feat/feature-name`
6. Add title and description
7. Click "Create pull request"

**Via CLI**:
```bash
# Using GitHub CLI (gh)
gh pr create --base dev --title "feat: new feature" --body "Description here"
```

---

## Vercel Auto-Creates Preview Deployment

Once PR is created, Vercel automatically:

1. **Detects new PR**: Within 30 seconds
2. **Starts build**: Creates temporary deployment
3. **Adds comment**: Posts preview URL in PR
4. **Shows status**: Green checkmark when ready

### Preview URL Format

```
https://guestbook-app-feat-feature-name.vercel.app
```

(Branch name replaces hyphens automatically)

---

## Testing Preview Deployment

### 1. View Preview URL

**From GitHub PR**:
1. Go to your PR on GitHub
2. Scroll down to "Deployments" section
3. Click "Visit deployment" link

**From Vercel Dashboard**:
1. Project → Deployments tab
2. Find PR deployment (shows PR number)
3. Click to open preview URL

### 2. Functional Testing

Test the specific feature you changed:

```
Preview URL: https://guestbook-app-feat-new-feature.vercel.app

- [ ] Feature works as expected
- [ ] No console errors (F12)
- [ ] No console warnings
- [ ] Responsive on mobile
- [ ] Performance acceptable
```

### 3. Performance Testing

```bash
# In browser DevTools
1. Press F12
2. Click "Lighthouse" tab
3. Click "Analyze page load"

# Check scores:
- Performance: > 70 (OK, not critical)
- Accessibility: > 85 (aim high)
- Best Practices: > 85 (aim high)
```

### 4. Security Testing

```bash
# Check no secrets exposed
1. Press Ctrl+U (View Page Source)
2. Search for "SUPABASE_SERVICE_ROLE_KEY"
3. Should find: NOTHING
4. OK if you see "NEXT_PUBLIC_SUPABASE_URL" (public is OK)

# Check HTTPS
- URL should start with https://
- Browser should show lock icon
```

---

## Merging Preview to Dev

Once satisfied with preview deployment:

### 1. Approve PR

**On GitHub**:
1. Go to PR
2. Click "Files changed" to review code
3. Click "Review changes" (top right)
4. Select "Approve"
5. Click "Submit review"

### 2. Merge PR to Dev

**Via GitHub UI** (easiest):
1. Go to PR
2. Click "Merge pull request" button
3. Choose merge strategy:
   - "Squash and merge": Combines all commits (recommended for features)
   - "Rebase and merge": Keeps commit history
   - "Create merge commit": Merge commit (default)
4. Click "Confirm merge"
5. Delete branch (optional but recommended)

**Via CLI**:
```bash
# Merge locally first
git checkout dev
git pull origin dev
git merge feat/feature-name
git push origin dev

# Or use gh
gh pr merge [PR-NUMBER] --merge
```

---

## Merging Dev to Main (Production)

When ready for production:

### 1. Create Release PR from Dev to Main

```bash
# Ensure main and dev are synchronized
git checkout main
git pull origin main

git checkout dev
git pull origin dev

# Create PR from dev to main
# Via GitHub UI or:
gh pr create --base main --head dev --title "Release: merge dev to main"
```

### 2. Test Release PR Preview

- Vercel creates preview for this PR too
- Preview runs with **Production** environment variables
- Final chance to test before going live

### 3. Merge Dev to Main

Once confident:

```bash
# Via GitHub UI:
# 1. Go to PR (dev → main)
# 2. Click "Merge pull request"
# 3. Confirm

# This triggers production deployment automatically
```

**Vercel auto-deploys to production** (from `main` branch):
- Takes 2-5 minutes
- Check Vercel dashboard for status
- Production URL: `https://guestbook-app.vercel.app`

---

## Branch Strategy

```
main (production)
  ↑
  └─── PR from dev (when ready to release)

dev (staging/integration)
  ↑
  ├─── feat/user-approval (PR)
  ├─── feat/content-moderation (PR)
  ├─── fix/upload-bug (PR)
  └─── chore/update-deps (PR)
```

---

## Environment Variables for Each Branch

| Environment | Branch | NODE_ENV | Supabase | Preview URL | Status |
|-------------|--------|----------|----------|------------|--------|
| **Production** | `main` | `production` | Same project | guestbook-app.vercel.app | Live for users |
| **Preview** | `dev` | `development` | Same project | guestbook-app-dev.vercel.app | For testing |
| **Local** | Any | `development` | Same project | localhost:4000 | Developer machine |

**Note**: All use the same Supabase project (same database). This allows testing with real data.

---

## Troubleshooting Preview Deployments

### Preview Build Failed

**Check logs**:
1. Go to Vercel Dashboard → Deployments
2. Click failed deployment
3. Click "Build Logs"
4. Search for "error"

**Common fixes**:
- TypeScript error: Fix locally, commit, push
- Dependency error: `npm install`, commit `package-lock.json`, push
- Environment variable missing: Add to Vercel dashboard

### Preview URL Shows 404

- Wait 2-3 minutes for build to complete
- Check Vercel dashboard shows green checkmark
- Hard refresh browser (Ctrl+Shift+R)
- Check PR comment for correct URL

### Preview Not Updating After Push

```bash
# Force Vercel to rebuild
git commit --allow-empty -m "chore: force rebuild"
git push origin feat/feature-name
```

### Can't Access Preview URL

- Check PR status on GitHub
- Look for Vercel comment with URL
- Ensure you're logged into GitHub (if private deployments)

---

## Best Practices

### Do's

- ✓ Always create feature branches from `dev`
- ✓ Test on preview URL before merging
- ✓ Write meaningful PR descriptions
- ✓ Delete branch after merging
- ✓ Keep commits atomic and well-described
- ✓ Run local tests before pushing

### Don'ts

- ✗ Never push directly to `main` (use dev first)
- ✗ Never commit .env files (use Vercel dashboard)
- ✗ Never expose secrets in PR descriptions
- ✗ Don't leave old feature branches (cleanup)
- ✗ Don't skip local testing before preview

---

## Advanced: Manual Preview Deployment

If GitHub integration issues:

```bash
# Deploy specific branch to preview
vercel deploy --prebuilt

# Or redeploy specific commit
vercel deploy --prod --prebuilt
```

---

## Monitoring Preview Deployments

### Vercel Analytics

For preview deployment:
1. Vercel Dashboard → Click preview deployment
2. Analytics tab
3. Monitor:
   - Response times
   - Request volume
   - Error rate

### Database Monitoring

```bash
# Check what changed in database
# Go to Supabase Dashboard
# SQL Editor → View recent queries
# Monitor table sizes
```

---

## Cleanup

### Delete Old Feature Branches

```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feat/feature-name

# Delete remote branch
git push origin --delete feat/feature-name
```

---

## Contact

For Vercel issues: https://vercel.com/support
For GitHub issues: https://github.com/contact

---

**Last Updated**: January 2026
**Version**: 1.0
