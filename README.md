# Giuliana's 40th Birthday Guestbook

A festive web application for collecting birthday messages, photos, and videos from friends.

**Status**: Ready for Production
**Tech Stack**: Next.js 14 + TypeScript + Supabase + Shadcn/ui
**Deployment**: Vercel (frontend) + Supabase Cloud (backend)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment](#deployment)
3. [Project Structure](#project-structure)
4. [Documentation](#documentation)
5. [Development](#development)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 18+ (`node --version`)
- npm or yarn
- Git

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/pierluigibaiano/g_gift.git
cd g_gift

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run development server
npm run dev
# Open http://localhost:4000

# 5. Run tests (optional)
npm run test
npm run test:e2e

# 6. Build for production
npm run build
npm start
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NODE_ENV=development
```

Get these values from: https://supabase.com/dashboard/project/_/settings/api

---

## Deployment

### Production Deployment (Vercel)

**Step 1: Verify Pre-Deployment Checklist**

```bash
# Ensure everything is ready
npm run build          # Build should succeed
npm run type-check     # No TypeScript errors
npm run lint           # No linting errors
git status             # Working tree clean
```

**Step 2: Connect to Vercel**

- Go to https://vercel.com/dashboard
- Click "Add New" → "Project"
- Select GitHub repository `g_gift`
- Click "Import"

**Step 3: Configure Environment Variables in Vercel**

1. Project → Settings → Environment Variables
2. Add three variables for **Production** environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Add same three variables for **Preview** environment

**Step 4: Deploy**

- Push to main branch:
  ```bash
  git push origin main
  ```
- Vercel auto-deploys within 1-2 minutes

**Step 5: Verify Deployment**

- Check Vercel dashboard for green checkmark
- Visit production URL and test all flows
- Run post-deployment checks (see docs/DEPLOYMENT.md)

### Full Deployment Guide

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for:
- Complete prerequisites checklist
- Environment configuration
- Custom domain setup
- Preview deployments for dev branch
- Troubleshooting and rollback procedures

---

## Project Structure

```
g_gift/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (guest)/           # Guest pages (upload)
│   │   ├── (vip)/             # VIP pages (gallery)
│   │   ├── (admin)/           # Admin pages (approval dashboards)
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable React components
│   │   ├── auth/
│   │   ├── gallery/
│   │   ├── upload/
│   │   └── admin/
│   ├── lib/                   # Utilities and helpers
│   │   ├── supabase/          # Supabase client setup
│   │   └── utils.ts
│   ├── middleware.ts          # Next.js middleware (auth)
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database migrations
├── docs/                      # Documentation
│   ├── DEPLOYMENT.md          # Deploy checklist (you are here)
│   └── ADMIN_GUIDE.md        # Admin operations
├── specs/                     # Project specifications
│   ├── README.md              # Spec docs index
│   ├── PRD.json               # 42 functional requirements
│   └── architecture.md        # Technical architecture
├── next.config.js             # Next.js configuration
├── vercel.json                # Vercel configuration
├── .vercelignore              # Files to exclude from deploy
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Dependencies
```

---

## Documentation

### For Different Audiences

| Role | Document | Purpose |
|------|----------|---------|
| **Developer (Setup)** | [Quick Start](#quick-start) | Get running locally |
| **Developer (Features)** | [specs/PRD.json](specs/PRD.json) | Understand requirements (42 items) |
| **Developer (Architecture)** | [specs/architecture.md](specs/architecture.md) | System design and database schema |
| **DevOps / Release** | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy to production |
| **Admin** | [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | How to approve users/content (Italian) |
| **AI Assistant** | [CLAUDE.md](CLAUDE.md) | Project context, setup, priorities |

### Quick Links

- **Functional Requirements**: [specs/PRD.json](specs/PRD.json) - 42 detailed requirements with acceptance criteria
- **Database Schema**: [specs/architecture.md](specs/architecture.md#database-schema)
- **Authentication Flow**: [specs/architecture.md](specs/architecture.md#authentication-flow)
- **Deployment Checklist**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Development

### NPM Scripts

```bash
npm run dev           # Start development server on port 4000
npm run build         # Build for production (.next folder)
npm start             # Start production server
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript compiler
npm run test          # Run Jest unit tests
npm run test:watch    # Run Jest in watch mode
npm run test:e2e      # Run Playwright E2E tests
```

### Linting & Type Checking

```bash
# Before committing
npm run lint
npm run type-check

# Fix auto-fixable issues
npm run lint -- --fix
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### Git Workflow

**Branches**:
- `main` → Production (auto-deploy on Vercel)
- `dev` → Development (preview deploys)
- `feat/*` → Feature branches

**Commits** (Conventional Commits):
```bash
git commit -m "feat: add emoji reactions"
git commit -m "fix: resolve upload progress bar"
git commit -m "chore: update dependencies"
git commit -m "docs: add admin guide"
```

---

## Features

### Core Features (MVP)

1. **3-Role Authentication**
   - Guest: Register, upload content, see pending approval status
   - Admin: Approve/reject users, moderate content
   - VIP (Giuliana): View only approved content, react with emojis

2. **Content Upload**
   - Text messages, photos, videos
   - Max 10 MB per file
   - Real-time upload progress

3. **Double Moderation**
   - Admin approves users before they can upload
   - Admin approves each content item before VIP sees it

4. **VIP Gallery**
   - Only approved content visible
   - Emoji reactions
   - Content filtering (text/photo/video)

5. **Security**
   - Database Row-Level Security (RLS)
   - Environment variable protection
   - HTTPS with security headers

---

## Troubleshooting

### Local Development

**Issue**: `Cannot find module '@/types/database'`

**Solution**:
```bash
# Regenerate TypeScript types
npm run type-check
npm run build
```

---

**Issue**: `Supabase connection failed`

**Solution**:
1. Verify `.env.local` has correct credentials
2. Check Supabase project is active: https://supabase.com/dashboard
3. Try restarting dev server: `npm run dev`

---

**Issue**: Build fails with `ERR_MODULE_NOT_FOUND`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Production Issues

See [docs/DEPLOYMENT.md#troubleshooting](docs/DEPLOYMENT.md#troubleshooting) for:
- Build failures
- Missing environment variables
- Database connection issues
- Performance problems

---

## Performance & Monitoring

### Lighthouse Targets
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

Check in Vercel Dashboard → Analytics

### Monitoring
- **Vercel Dashboard**: https://vercel.com/dashboard
  - Real-time deployment status
  - Performance metrics
  - Error rate monitoring

- **Supabase Dashboard**: https://supabase.com/dashboard
  - Database status
  - Storage usage (< 500 MB free tier limit)
  - Query performance

---

## Security

### Environment Variables

**Public** (visible in browser, safe to expose):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Secret** (server-only, NEVER expose):
- `SUPABASE_SERVICE_ROLE_KEY` ← Never in browser
- `NODE_ENV`

### Best Practices

- Never commit `.env.local` to Git (added to `.gitignore`)
- Use Vercel's Environment Variables dashboard for production secrets
- Enable Database Row-Level Security (RLS) in Supabase
- All API routes validate user permissions on backend

### Security Headers

Auto-configured in `next.config.js`:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

---

## Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Help
- **Vercel Support**: https://vercel.com/support
- **Supabase Community**: https://supabase.com/community
- **GitHub Issues**: Report bugs in this repository

---

## License

Private project for Giuliana's 40th birthday (January 2026)

---

## Contact

**Project Owner**: Pierluigi Baiano
**Event Date**: January 24, 2026
**Duration**: 2 weeks (mid-January 2026)

---

**Last Updated**: January 23, 2026
**Version**: 1.0.0 (Production Ready)
