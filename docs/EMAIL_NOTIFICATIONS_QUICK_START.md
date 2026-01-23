# Email Notifications - Quick Start

## Setup in 5 Minutes

### 1. Get Resend API Key (2 minutes)

1. Visit: https://resend.com/signup
2. Sign up with email (free, no credit card)
3. Go to Settings → API Keys
4. Create new API key
5. Copy the key (starts with `re_`)

### 2. Configure Environment (1 minute)

Add to `.env.local`:
```env
RESEND_API_KEY=re_your_actual_api_key_here
ADMIN_EMAIL=your-email@example.com
```

Replace:
- `re_your_actual_api_key_here` with your actual Resend API key
- `your-email@example.com` with your email address

### 3. Test Locally (1 minute)

```bash
# Start dev server
npm run dev

# Visit test endpoint
# http://localhost:4000/api/test-email

# Check your email inbox
```

### 4. Deploy to Vercel (1 minute)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `RESEND_API_KEY` = your Resend API key
   - `ADMIN_EMAIL` = your email
3. Redeploy

## What You Get

When a guest uploads content, you receive an email with:
- User name and email
- Content type (text/photo/video)
- Preview (for text)
- Direct link to admin dashboard

Example email:
```
Subject: 📷 Nuovo foto da approvare - Mario Rossi

🎉 Nuovo contenuto da approvare

Utente: Mario Rossi (mario@example.com)
Tipo: FOTO
Data: 23/01/2026, 14:30

[Vai alla Dashboard Admin]
```

## Important Notes

- Emails are non-blocking: uploads work even if email fails
- Free tier: 100 emails/day (more than enough)
- Default sender: `onboarding@resend.dev`
- May go to spam initially (check spam folder)
- For custom domain: see full setup guide

## Need Help?

See full documentation: `/Users/pierluigibaiano/Development/g_gift/docs/EMAIL_NOTIFICATIONS_SETUP.md`

## Remove Test Endpoint

Before production, remove or secure:
`/Users/pierluigibaiano/Development/g_gift/src/app/api/test-email/route.ts`
