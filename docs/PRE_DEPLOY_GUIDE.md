# Pre-Deployment Guide - Giuliana's 40th Birthday Guestbook

## Introduction

This guide explains how to use the pre-deployment verification tools to ensure your application is ready for production deployment on Vercel.

## Files Created

1. **DEPLOYMENT_CHECKLIST.md** - Complete manual checklist with all deployment steps
2. **scripts/pre-deploy-check.sh** - Automated verification script

## How to Use the Verification Script

### Prerequisites

- Node.js and npm installed
- Project cloned locally
- Dependencies installed (`npm install`)

### Running the Script

```bash
# From project root
cd /Users/pierluigibaiano/Development/g_gift

# Run the script
./scripts/pre-deploy-check.sh
```

### What the Script Verifies

The script performs 8 automated checks:

1. **Node.js and npm versions**: Verifies they are installed
2. **Dependencies**: Checks that node_modules exists
3. **TypeScript Type Check**: Runs `npm run type-check`
4. **Build Test**: Runs `npm run build` to verify compilation
5. **Critical Files**: Verifies all essential files exist:
   - middleware.ts
   - Supabase clients
   - All main pages
   - SQL migrations
6. **Environment Variables**: Checks .env.local
7. **Hardcoded Values**: Searches for localhost or secrets in code
8. **Git Status**: Verifies repository and branch

### Script Output

#### Success (Exit Code 0)
```
========================================
  Pre-Deployment Check Summary
========================================

✓ All checks passed!

Your application is ready for deployment.

Next steps:
1. Review DEPLOYMENT_CHECKLIST.md
2. Ensure Supabase database is set up
3. Configure environment variables in Vercel
4. Push to main branch: git push origin main
```

#### Error (Exit Code 1)
```
========================================
  Pre-Deployment Check Summary
========================================

✗ Found 2 error(s)

Please fix the errors above before deploying.
```

### Message Interpretation

- **✓ Green**: Check passed successfully
- **✗ Red**: Critical error blocking deployment
- **⚠ Yellow**: Warning - doesn't block but needs attention
- **ℹ Blue**: Additional information

## Recommended Workflow

### Phase 1: Local Verification (10 minutes)

```bash
# 1. Run the automated script
./scripts/pre-deploy-check.sh

# 2. If there are errors, fix them and re-run
# Example: if TypeScript has errors
npm run type-check  # See specific errors
# Fix the errors
./scripts/pre-deploy-check.sh  # Re-run
```

### Phase 2: Manual Checklist (30-60 minutes)

Open `DEPLOYMENT_CHECKLIST.md` and follow each section:

1. **Database Setup**: Verify Supabase
   - Migrations executed
   - Admin and VIP users created
   - Storage bucket configured

2. **Environment Variables**: Configure on Vercel
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. **Security Tests**: Manual tests
   - XSS protection
   - RLS policies
   - File upload limits

4. **E2E Tests**: Complete flow
   - Guest registration → Admin approval → Upload → VIP view

5. **Mobile Tests**: Responsive design
   - iPhone Safari
   - Android Chrome

### Phase 3: Deploy (5-10 minutes)

```bash
# 1. Final commit
git add .
git commit -m "chore: pre-deployment final checks"

# 2. Push to main (triggers Vercel auto-deploy)
git push origin main

# 3. Monitor deployment on Vercel
# Go to: https://vercel.com/dashboard

# 4. Verify production URL
# Visit: https://[your-project].vercel.app
```

## Troubleshooting

### Error: "TypeScript errors found"

```bash
# See specific errors
npm run type-check

# Common errors:
# - Missing imports: add necessary imports
# - Type mismatch: fix types in props/functions
# - Undefined variables: initialize variables
```

### Error: "Build failed"

```bash
# See detailed log
cat /tmp/build.log

# Common errors:
# - Module not found: npm install [package]
# - Syntax error: fix code
# - Environment variable missing: add to .env.local
```

### Error: "Critical file missing"

If a critical file is missing, the project is incomplete.

Possible causes:
- File moved/renamed
- Wrong branch (switch to main)
- Git pull needed

### Warning: "Uncommitted changes"

Not a critical error, but before deploying you should:

```bash
# See what changed
git status

# Options:
# 1. Commit changes
git add .
git commit -m "feat: last changes before deploy"

# 2. Temporary stash (if not ready)
git stash

# 3. Discard (if not needed)
git checkout -- [file]
```

### Warning: ".env.local not found"

The script accepts this warning if env variables are configured on Vercel.

Verify on Vercel Dashboard:
1. Go to Settings > Environment Variables
2. Check that the 3 required variables exist
3. If missing, add them

## Best Practices

### Before Every Deploy

1. Always run the script: `./scripts/pre-deploy-check.sh`
2. If there are errors, DON'T deploy until resolved
3. Warnings are OK but evaluate case by case

### Recommended Timeline

- **T-3 days**: Deploy to production
- **T-2 days**: Feature freeze (bugfixes only)
- **T-1 day**: Final testing and monitoring
- **D-Day**: Monitoring only, zero changes

### Backup Plan

If something goes wrong in production:

```bash
# Quick rollback (3 minutes)
git revert HEAD
git push origin main
# Vercel auto-redeploys
```

Or on Vercel Dashboard:
1. Deployments tab
2. Find previous working deployment
3. Click "Redeploy"

## FAQ

### Q: How long does the script take?
**A:** 2-5 minutes (depends on build speed)

### Q: Should I run the script every time?
**A:** Yes, before every push to main going to production

### Q: Can I skip some checks?
**A:** No, all checks are essential for safe deployment

### Q: Does the script modify code?
**A:** No, it's read-only. Only verifies, doesn't modify

### Q: What happens if I ignore an error?
**A:** Vercel deployment might fail or app might not work

### Q: Can I customize the script?
**A:** Yes, it's a bash script. But keep essential checks

## Support Contacts

If the script fails with unexplained errors:

1. Check logs: `/tmp/build.log`
2. Verify versions: Node.js v18+, npm v8+
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check git branch: `git status` (should be on main)

**Technical Documentation:**
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

---

**Last Updated**: January 23, 2026
**Version**: 1.0
