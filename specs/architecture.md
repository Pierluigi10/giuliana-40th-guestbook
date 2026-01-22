# Technical Architecture

## Stack Rationale

### Why Next.js Fullstack (not NestJS + Next.js separate)?

| Aspect | Next.js Fullstack | NestJS + Next.js |
|--------|-------------------|------------------|
| Setup time | 30 minutes | 2+ hours |
| Projects to manage | 1 | 2 |
| Deploy targets | 1 (Vercel) | 2 (Vercel + Railway/Render) |
| CORS config | None (same origin) | Required |
| API development | API routes instant | Controllers + Modules |
| Time to first feature | ~1 day | ~2-3 days |
| **Total time saved** | **3-4 days** | - |

**Verdict**: With 14-day timeline, Next.js fullstack is only pragmatic choice.

### Why Supabase (not PostgreSQL + Auth0 + S3)?

| Feature | Supabase | Separate Services |
|---------|----------|-------------------|
| Setup | 1 hour | 1 day |
| Services | DB + Auth + Storage + Realtime | 3+ services |
| Cost (50 users) | $0 | $0-50/month |
| Row Level Security | Built-in | Custom middleware |
| File uploads | Integrated API | S3 SDK + config |

**Free tier limits**:
- 500MB database
- 1GB file storage
- 50k monthly active users
- 2GB bandwidth

**Sufficient for**: 50 users, ~200 content items (50MB photos + 20 videos)

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel Edge                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Next.js 14 App Router                    │ │
│  │                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │ Client Pages │  │ API Routes   │             │ │
│  │  │  - /login    │  │  - /upload   │             │ │
│  │  │  - /admin/*  │  │  - /content  │             │ │
│  │  │  - /guest/*  │  │  - /users    │             │ │
│  │  │  - /vip/*    │  │              │             │ │
│  │  └──────┬───────┘  └──────┬───────┘             │ │
│  │         │                  │                      │ │
│  │         └──────────┬───────┘                      │ │
│  │                    │                              │ │
│  │         ┌──────────▼──────────┐                  │ │
│  │         │   Supabase Client   │                  │ │
│  │         │   Auth Helpers      │                  │ │
│  │         └──────────┬──────────┘                  │ │
│  └────────────────────┼────────────────────────────┘ │
└────────────────────────┼────────────────────────────┘
                         │
                         │ HTTPS + JWT
                         │
        ┌────────────────▼────────────────┐
        │      Supabase Cloud             │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │   PostgreSQL 15          │  │
        │  │   - profiles             │  │
        │  │   - content              │  │
        │  │   - reactions            │  │
        │  │   RLS Policies ✓         │  │
        │  └──────────────────────────┘  │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │   Auth (JWT)             │  │
        │  │   - Email provider       │  │
        │  │   - Session mgmt         │  │
        │  └──────────────────────────┘  │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │   Storage                │  │
        │  │   - content-media bucket │  │
        │  │   - Image transform API  │  │
        │  └──────────────────────────┘  │
        └─────────────────────────────────┘
```

## Project Structure

```
guestbook-app/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Route group: public auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login form
│   │   │   ├── register/
│   │   │   │   └── page.tsx         # Guest registration
│   │   │   └── pending-approval/
│   │   │       └── page.tsx         # Waiting for admin approval
│   │   │
│   │   ├── (admin)/                 # Route group: admin only
│   │   │   ├── layout.tsx           # Admin layout
│   │   │   ├── approve-users/
│   │   │   │   └── page.tsx         # User approval dashboard
│   │   │   └── approve-content/
│   │   │       └── page.tsx         # Content moderation queue
│   │   │
│   │   ├── (vip)/                   # Route group: VIP (Giuliana) only
│   │   │   ├── layout.tsx           # VIP layout
│   │   │   └── gallery/
│   │   │       └── page.tsx         # Gallery of approved content
│   │   │
│   │   ├── (guest)/                 # Route group: approved guests only
│   │   │   ├── layout.tsx           # Guest layout
│   │   │   └── upload/
│   │   │       └── page.tsx         # Upload form (text/photo/video)
│   │   │
│   │   ├── api/                     # API Routes
│   │   │   ├── upload/
│   │   │   │   └── route.ts         # POST file upload
│   │   │   ├── content/
│   │   │   │   └── route.ts         # GET/PATCH content
│   │   │   └── users/
│   │   │       └── route.ts         # GET/PATCH users
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home redirect
│   │
│   ├── components/
│   │   ├── ui/                      # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PendingApproval.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── UserApprovalQueue.tsx
│   │   │   ├── ContentApprovalQueue.tsx
│   │   │   ├── ApprovalCard.tsx
│   │   │   └── AdminStats.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── UploadForm.tsx
│   │   │   ├── TextUpload.tsx
│   │   │   ├── PhotoUpload.tsx
│   │   │   ├── VideoUpload.tsx
│   │   │   ├── DropZone.tsx
│   │   │   └── MediaPreview.tsx
│   │   │
│   │   ├── content/
│   │   │   ├── Gallery.tsx
│   │   │   ├── ContentCard.tsx
│   │   │   ├── TextCard.tsx
│   │   │   ├── PhotoCard.tsx
│   │   │   ├── VideoCard.tsx
│   │   │   ├── MediaViewer.tsx        # Lightbox
│   │   │   ├── ReactionPicker.tsx
│   │   │   └── FilterBar.tsx
│   │   │
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── ConfettiEffect.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # 🔑 Browser client
│   │   │   ├── server.ts            # 🔑 Server client
│   │   │   └── middleware.ts        # Middleware client
│   │   │
│   │   ├── auth.ts                  # Auth helpers
│   │   ├── storage.ts               # Upload helpers
│   │   └── utils.ts                 # General utilities
│   │
│   ├── types/
│   │   ├── database.ts              # Supabase generated types
│   │   ├── content.ts               # Content types
│   │   └── user.ts                  # User types
│   │
│   ├── actions/                     # Server Actions
│   │   ├── users.ts                 # User approval actions
│   │   ├── content.ts               # Content moderation actions
│   │   └── reactions.ts             # Reaction actions
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useUser.ts
│   │   ├── useContent.ts
│   │   └── useSupabase.ts
│   │
│   └── middleware.ts                # 🔑 Route protection middleware
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # 🔑 Tables + indexes
│   │   ├── 002_rls_policies.sql     # 🔑 Row Level Security
│   │   └── 003_seed_data.sql        # Admin + VIP users
│   │
│   └── config.toml                  # Supabase local config
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png                 # Open Graph preview
│   └── icons/
│
├── specs/
│   ├── PRD.json                     # 42 requirements
│   ├── architecture.md              # This file
│   └── README.md
│
├── .env.local                       # Environment variables (gitignored)
├── .env.example                     # Template for env vars
├── CLAUDE.md                        # Main entry point for AI
├── README.md                        # Project README
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Database Schema

### Tables

```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'vip', 'guest')),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content (text messages, photos, videos)
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

-- Emoji reactions on content
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_id, user_id, emoji)
);

-- Performance indexes
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_user ON content(user_id);
CREATE INDEX idx_content_created ON content(created_at DESC);
CREATE INDEX idx_reactions_content ON reactions(content_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Profiles: readable by authenticated users
CREATE POLICY "Profiles are readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Content: approved readable by VIP and Admin
CREATE POLICY "Approved content readable by VIP and Admin"
  ON content FOR SELECT
  TO authenticated
  USING (
    status = 'approved' AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('vip', 'admin')
    )
  );

-- Content: pending readable only by Admin
CREATE POLICY "Pending content readable by Admin only"
  ON content FOR SELECT
  TO authenticated
  USING (
    status = 'pending' AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Content: guests can insert if approved
CREATE POLICY "Approved guests can insert content"
  ON content FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guest' AND
    (SELECT is_approved FROM profiles WHERE id = auth.uid()) = true
  );

-- Content: admin can update status
CREATE POLICY "Admin can update content status"
  ON content FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Reactions: users can manage their own
CREATE POLICY "Users can manage their own reactions"
  ON reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Authentication & Authorization Flow

### User Registration (Guest)

```
1. Guest opens /register
2. Submits email, full_name, password
3. Supabase Auth creates user in auth.users
4. Trigger auto-creates profile (role='guest', is_approved=false)
5. Redirect to /pending-approval
6. Email confirmation sent (optional)
```

### User Approval (Admin)

```
1. Admin opens /admin/approve-users
2. Fetches profiles WHERE role='guest' AND is_approved=false
3. Admin clicks "Approve" on a guest
4. Server Action: UPDATE profiles SET is_approved=true WHERE id=X
5. Guest can now login and access /guest/upload
6. (Optional) Email notification sent to guest
```

### Content Upload (Guest)

```
1. Approved guest opens /guest/upload
2. Selects tab: Text | Photo | Video
3. Fills form / selects file
4. Client validation (size, type, length)
5. Submit → API route /api/upload
6. Server validation
7. If file: Upload to Supabase Storage (content-media/{userId}/{uuid}.{ext})
8. INSERT into content (status='pending')
9. Toast: "Content uploaded, awaiting approval"
```

### Content Moderation (Admin)

```
1. Admin opens /admin/approve-content
2. Fetches content WHERE status='pending' ORDER BY created_at DESC
3. Preview: text full, image thumbnail, video player
4. Admin clicks "Approve" or "Reject"
5. Server Action: UPDATE content SET status='approved'|'rejected'
6. Content removed from pending queue (UI update)
```

### VIP Gallery (Giuliana)

```
1. VIP opens /vip/gallery
2. Fetches content WHERE status='approved' ORDER BY approved_at DESC
3. Renders ContentCard grid (masonry layout)
4. Click photo → opens Lightbox (yet-another-react-lightbox)
5. Click emoji → INSERT/DELETE reaction
6. First visit: Confetti animation (canvas-confetti)
```

## Middleware Route Protection

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Public routes
  if (path.startsWith('/login') || path.startsWith('/register')) {
    return res
  }

  // Require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', session.user.id)
    .single()

  // Admin routes
  if (path.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // VIP routes
  if (path.startsWith('/vip') && profile?.role !== 'vip') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Guest routes (must be approved)
  if (path.startsWith('/guest')) {
    if (profile?.role !== 'guest' || !profile?.is_approved) {
      return NextResponse.redirect(new URL('/pending-approval', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vip/:path*',
    '/guest/:path*',
    '/login',
    '/register'
  ]
}
```

## File Upload Strategy

### Client-side (Browser)

```typescript
// src/components/upload/PhotoUpload.tsx
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const onDrop = useCallback(async (acceptedFiles: File[]) => {
  const file = acceptedFiles[0]

  // Validation
  if (file.size > MAX_SIZE) {
    toast.error('File troppo grande, max 10MB')
    return
  }

  // Optional: Client-side compression
  const compressed = await compressImage(file, { maxWidth: 1920 })

  // Upload via API route
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('type', 'image')

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  if (res.ok) {
    toast.success('Foto caricata, in attesa di approvazione')
  }
}, [])

const { getRootProps, getInputProps } = useDropzone({
  onDrop,
  accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  maxFiles: 1
})
```

### Server-side (API Route)

```typescript
// src/app/api/upload/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Auth check
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check user is approved guest
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'guest' || !profile?.is_approved) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string // 'image' | 'video'

  // Validation
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('content-media')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL (signed, expires in 1 year)
  const { data: { publicUrl } } = supabase.storage
    .from('content-media')
    .getPublicUrl(fileName)

  // Insert content record
  const { data: content, error: dbError } = await supabase
    .from('content')
    .insert({
      user_id: session.user.id,
      type,
      media_url: publicUrl,
      status: 'pending'
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ content })
}
```

## UI Theme Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        birthday: {
          pink: '#FF69B4',
          purple: '#9D4EDD',
          gold: '#FFD700',
          sky: '#87CEEB',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config
```

## Deployment

### Vercel Setup

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "feat: initial commit"
gh repo create guestbook-40 --public --push

# 2. Import on Vercel
# - Go to vercel.com
# - Import repository
# - Add environment variables:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY

# 3. Deploy
# - Auto-deploy on push to main
# - Preview deploys on pull requests
```

### Supabase Setup

```bash
# 1. Create project on supabase.com
# 2. Run migrations from SQL Editor
# 3. Create Storage bucket 'content-media'
# 4. Configure RLS policies
# 5. Add seed data (admin + VIP users)
# 6. Copy API keys to Vercel env vars
```

## Performance Optimizations

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={content.media_url}
  alt={content.text_content || 'Photo'}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurDataURL}
  loading="lazy"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### Lazy Loading

```typescript
// Gallery with intersection observer
import { useEffect, useRef } from 'react'

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Load more content
    }
  })
})

useEffect(() => {
  const sentinel = sentinelRef.current
  if (sentinel) observer.observe(sentinel)
  return () => observer.disconnect()
}, [])
```

### Database Query Optimization

```sql
-- Fetch gallery content with user info in single query
SELECT
  c.*,
  p.full_name as author_name,
  COUNT(r.id) as reaction_count
FROM content c
JOIN profiles p ON c.user_id = p.id
LEFT JOIN reactions r ON c.id = r.content_id
WHERE c.status = 'approved'
GROUP BY c.id, p.full_name
ORDER BY c.approved_at DESC
LIMIT 20;
```

## Security Considerations

### Input Sanitization

```typescript
// Server-side text content sanitization
import DOMPurify from 'isomorphic-dompurify'

const sanitizedText = DOMPurify.sanitize(text_content, {
  ALLOWED_TAGS: [], // Strip all HTML
  ALLOWED_ATTR: []
})
```

### Rate Limiting

```typescript
// API route with rate limiting
import { ratelimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const identifier = session.user.id
  const { success } = await ratelimit.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Continue...
}
```

### HTTPS Only

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}
```

## Monitoring & Observability

### Error Tracking

```typescript
// Error boundary with logging
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      onError={(error, errorInfo) => {
        console.error('Error caught:', error, errorInfo)
        // Optional: Send to Sentry/LogRocket
      }}
      fallback={<ErrorFallback />}
    >
      {children}
    </ErrorBoundaryComponent>
  )
}
```

### Performance Monitoring

```typescript
// Web Vitals tracking
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric)
  // Optional: Send to analytics
}
```

### Supabase Logs

- **Dashboard → Logs → API**: Monitor API requests
- **Dashboard → Logs → Auth**: Track authentication events
- **Dashboard → Logs → Storage**: File upload monitoring
- **Dashboard → Database → Query performance**: Slow query identification

## Backup & Recovery

### Database Backup

```bash
# Manual export from Supabase Dashboard
# → Project Settings → Database → Backups
# → Download backup (SQL dump)

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Storage Backup

```bash
# Use Supabase CLI
npx supabase storage download content-media --all --output ./backup/
```

## Testing Strategy

### Unit Tests

```typescript
// components/__tests__/ContentCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ContentCard } from '../ContentCard'

describe('ContentCard', () => {
  it('renders text content', () => {
    const content = { type: 'text', text_content: 'Test message' }
    render(<ContentCard content={content} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/guest-flow.spec.ts
import { test, expect } from '@playwright/test'

test('guest uploads content', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/pending-approval')
})
```

## Future Enhancements (Post-MVP)

- Real-time notifications (Supabase Realtime)
- Comments on content
- Download entire gallery (ZIP export)
- Admin analytics dashboard
- PWA (offline mode)
- Multi-language support
- Email digest for Giuliana (weekly summary)
