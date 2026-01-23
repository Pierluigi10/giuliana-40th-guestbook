# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: Contact the project owner directly
2. **Private Security Advisory**: Create a private security advisory on GitHub (if you have access)

Please include the following information:
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond to security reports within 48 hours and work to address critical issues as quickly as possible.

## Security Best Practices

### Environment Variables

**Never commit sensitive data to the repository:**

- ✅ Use `.env.local` for local development (already in `.gitignore`)
- ✅ Use Vercel Environment Variables for production secrets
- ✅ Only commit `.env.example` files with placeholder values
- ❌ Never commit `.env` or `.env.local` files
- ❌ Never hardcode API keys, tokens, or passwords in source code

### API Keys and Secrets

**Public keys** (safe to expose in browser):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Secret keys** (server-only, NEVER expose):
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only, bypasses RLS
- `RESEND_API_KEY` - Email service API key
- `ADMIN_EMAIL` - Admin notification email

### Database Security

- **Row-Level Security (RLS)**: All tables have RLS policies enabled
- **Service Role Key**: Only used in server-side API routes, never exposed to client
- **Anon Key**: Limited permissions via RLS policies

### Authentication

- Email confirmation required for all new users
- Password requirements: Minimum 6 characters (enforced by Supabase)
- Session tokens managed by Supabase Auth
- No password storage in application code

### File Uploads

- Maximum file size: 10 MB per file
- Allowed file types: Images (jpg, png, gif, webp), Videos (mp4, webm), Text
- Files stored in Supabase Storage with public read access (for approved content only)
- Upload validation on both client and server

### Content Moderation

- All user-uploaded content requires admin approval before VIP can view
- Admin dashboard protected by role-based access control
- Content visibility controlled by database RLS policies

### Security Headers

The application includes the following security headers (configured in `vercel.json`):

- `Strict-Transport-Security`: Enforces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: XSS protection

### Dependencies

- Regular dependency updates via `npm audit`
- No known critical vulnerabilities in production dependencies
- Dependencies are locked via `package-lock.json`

## Known Security Considerations

1. **Supabase Free Tier**: Limited to 500 MB storage, monitor usage
2. **Rate Limiting**: Consider implementing rate limiting for uploads in production
3. **Content Moderation**: Manual approval process - ensure admin availability

## Security Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] No hardcoded secrets in source code
- [ ] RLS policies enabled on all Supabase tables
- [ ] Security headers configured in `vercel.json`
- [ ] Dependencies updated (`npm audit` shows no critical issues)
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Admin credentials stored securely (password manager)

## Updates

This security policy may be updated as the project evolves. Last updated: January 23, 2026.
