# Giuliana's 40th Birthday Guestbook

**Type**: Private guestbook web app for collecting messages, photos, and videos from friends
**Timeline**: 2 weeks (deploy before birthday)
**Users**: 20-50 friends + 1 admin (Pierluigi) + 1 VIP (Giuliana)
**Language**: Italian UI/content (this doc in English by convention)

## Quick Reference

- **Stack**: Next.js 14 + TypeScript + Supabase + Shadcn/ui
- **Design**: Colorful and festive (pink, purple, gold)
- **Security**: Double moderation (users + content)
- **Hosting**: Vercel (frontend) + Supabase Cloud (free tier)

## Documentation Structure

```
specs/
├── PRD.json              # 42 functional requirements with acceptance criteria
├── architecture.md       # Technical architecture details
└── README.md            # Project overview
```

## Core Features (MVP)

1. **3-role Auth**: admin, vip, guest with approval workflow
2. **Upload**: text + photo + video (max 10MB per file)
3. **Moderation**: admin approves users AND content before VIP can see
4. **VIP Gallery**: Giuliana sees only approved content
5. **Reactions**: emoji reactions on content

## Key Technical Decisions

- **Next.js fullstack** (not NestJS + Next.js separate) → saves 3-4 days
- **Supabase all-in-one** (DB + Auth + Storage) → 1 hour setup vs 1 day
- **RLS policies** → database-level security, no API bypass
- **Shadcn/ui** → copy-paste components, zero bundle bloat

## Implementation Priority

**Week 1**: Setup + Auth + User approval + Content upload + Content approval
**Week 2**: VIP Gallery + Reactions + Filters + UI polish + Deploy + Testing

## Git Workflow

**Conventional Commits**:
- `feat: add user approval dashboard`
- `fix: resolve upload progress bar issue`
- `chore: update dependencies`
- `docs: add admin guide`
- `style: apply festive color theme`
- `refactor: extract ContentCard component`
- `test: add E2E gallery flow`
- `perf: optimize image lazy loading`

**Branches**:
- `main` → production (auto-deploy Vercel)
- `dev` → development (preview deploys)
- `feat/*` → feature branches

## Setup Commands

```bash
# Initial setup
npx create-next-app@latest guestbook-app --typescript --tailwind --app --src-dir
cd guestbook-app
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install framer-motion canvas-confetti react-dropzone
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea dialog avatar badge dropdown-menu

# Development
npm run dev

# Build
npm run build
npm start

# Deploy
git add .
git commit -m "feat: initial commit"
git push origin main  # Auto-deploy on Vercel
```

## Critical Files (Create First)

1. `src/lib/supabase/client.ts` - Supabase client setup
2. `src/middleware.ts` - Route protection by role
3. `supabase/migrations/001_initial_schema.sql` - DB schema + RLS policies
4. `src/app/api/upload/route.ts` - File upload API route
5. `src/components/content/ContentCard.tsx` - Content display component

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## Architecture

See detailed technical architecture → [specs/architecture.md](specs/architecture.md)

## Requirements

See all functional requirements (42 items) → [specs/PRD.json](specs/PRD.json)

## Success Criteria

- **Functional**: 30+ registered friends, 50+ uploaded content items
- **Quality**: Zero critical bugs, Lighthouse Performance >80
- **Timeline**: Deploy 3 days before birthday, feature freeze 2 days before
- **Security**: All E2E and security tests passed

## Testing Checklist

- [ ] E2E flow: guest register → admin approve → upload → approve → VIP view
- [ ] Security: unauthorized access blocked, RLS policies enforced
- [ ] Performance: Lighthouse >80 mobile, lazy loading working
- [ ] Cross-browser: Chrome, Safari, Firefox latest 2 versions
- [ ] Mobile: iOS Safari, Android Chrome responsive and functional

## Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Storage limit (500MB free) | Image compression, 10MB limit, monitor usage |
| Bulk uploads near event | Rate limiting (1/min), video compression guide |
| Critical bug pre-event | Deploy 3 days early, feature freeze 2 days early |
| Admin approval delays | Email notifications, mobile-friendly dashboard |

## Admin Operations (Pierluigi)

**Moderate content**: `/admin/approve-content` → preview → approve/reject
**Invite friends**: Share registration link `https://[domain]/register`

**New registration flow** (updated 2026-01-23):
Friends must:
1. Register with valid email
2. Confirm email by clicking the received link (automatic Supabase confirmation)
3. Log in and upload content
4. Admin approves ONLY content (no longer users)

~~**Approve users**: Removed - user approval no longer required~~

Full admin guide: (create `docs/ADMIN_GUIDE.md` after implementation)
