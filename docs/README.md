# Documentation Index

Welcome to the g_gift documentation! This directory contains all technical and operational documentation for the Giuliana's 40th Birthday Guestbook project.

---

## Quick Start Guides

Start here if you're setting up the project for the first time:

| Guide | Purpose | Time | Audience |
|-------|---------|------|----------|
| [QUICK_START_USERS.md](QUICK_START_USERS.md) | Create admin and VIP users in Supabase | 5 min | Developers |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Complete Supabase database setup | 15-20 min | Developers |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | How to use admin dashboard | 10 min | Admin (Pierluigi) |

---

## Setup & Configuration

### Database & Authentication

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Complete guide to setting up Supabase
  - Execute SQL migrations
  - Create storage bucket
  - Set up Row Level Security policies
  - Create and promote users
  - Verify setup with test queries

- **[QUICK_START_USERS.md](QUICK_START_USERS.md)** - Fast 5-minute user setup
  - Create admin user (Pierluigi)
  - Create VIP user (Giuliana)
  - Promote users with SQL functions
  - Test login for both roles

- **[CREDENTIALS.md](CREDENTIALS.md)** - User credentials management
  - Admin and VIP credentials (DO NOT commit real passwords!)
  - Password security guidelines
  - How to securely share passwords
  - Password reset procedures
  - Verification queries

### Deployment

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
  - Deploy to Vercel
  - Environment variables configuration
  - Domain setup
  - Production checklist
  - Monitoring and maintenance

- **[PREVIEW_DEPLOYMENTS.md](PREVIEW_DEPLOYMENTS.md)** - Preview deployment workflow
  - How Vercel preview deployments work
  - Testing features before production
  - Managing multiple environments

---

## Operational Guides

### Admin Operations

- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** - Complete admin dashboard manual
  - How to approve users
  - How to moderate content
  - How to manage reactions
  - Common admin tasks
  - Troubleshooting user issues

---

## Technical Documentation

### Error Handling

- **[ERROR_HANDLING_FLOW.md](ERROR_HANDLING_FLOW.md)** - Error handling architecture
  - Error boundary hierarchy
  - Error types and recovery strategies
  - Logging and monitoring
  - User-facing error messages

- **[ERROR_BOUNDARIES_CHEATSHEET.md](ERROR_BOUNDARIES_CHEATSHEET.md)** - Quick reference
  - Error boundary component usage
  - When to use each boundary type
  - Common error scenarios

- **[ERROR_UI_PREVIEW.md](ERROR_UI_PREVIEW.md)** - Error UI design preview
  - Visual mockups of error states
  - User experience for errors
  - Design guidelines

### Database Operations

- **[SQL_CHEATSHEET.md](SQL_CHEATSHEET.md)** - SQL quick reference
  - User management queries
  - Content moderation queries
  - Reactions and analytics
  - Storage management
  - Database health checks
  - Emergency operations

---

## Document Organization

```
docs/
├── README.md                           # This file - documentation index
│
├── Quick Start (Setup in minutes)
│   ├── QUICK_START_USERS.md           # Create admin/VIP users (5 min)
│   └── SUPABASE_SETUP.md              # Complete Supabase setup (20 min)
│
├── Configuration & Security
│   ├── CREDENTIALS.md                  # User credentials & security
│   ├── DEPLOYMENT.md                   # Production deployment
│   └── PREVIEW_DEPLOYMENTS.md         # Preview environments
│
├── Operational Guides
│   ├── ADMIN_GUIDE.md                 # Admin dashboard manual
│   └── SQL_CHEATSHEET.md              # SQL quick reference
│
└── Technical Reference
    ├── ERROR_HANDLING_FLOW.md         # Error handling architecture
    ├── ERROR_BOUNDARIES_CHEATSHEET.md # Error boundary reference
    └── ERROR_UI_PREVIEW.md            # Error UI design
```

---

## Common Tasks

### I want to...

**Set up the project from scratch**
1. Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Complete database setup
2. Read [QUICK_START_USERS.md](QUICK_START_USERS.md) - Create admin/VIP users
3. Read [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to production

**Learn how to use the admin dashboard**
1. Read [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Complete admin manual
2. Reference [SQL_CHEATSHEET.md](SQL_CHEATSHEET.md) - SQL operations

**Manage users and content via SQL**
1. Read [SQL_CHEATSHEET.md](SQL_CHEATSHEET.md) - Complete SQL reference
2. Reference [CREDENTIALS.md](CREDENTIALS.md) - User management

**Deploy to production**
1. Read [DEPLOYMENT.md](DEPLOYMENT.md) - Step-by-step deployment guide
2. Reference [CREDENTIALS.md](CREDENTIALS.md) - Secure credential management

**Understand error handling**
1. Read [ERROR_HANDLING_FLOW.md](ERROR_HANDLING_FLOW.md) - Architecture overview
2. Reference [ERROR_BOUNDARIES_CHEATSHEET.md](ERROR_BOUNDARIES_CHEATSHEET.md) - Quick reference

**Create test users**
1. Read [QUICK_START_USERS.md](QUICK_START_USERS.md) - User creation process
2. Reference [CREDENTIALS.md](CREDENTIALS.md) - Test user guidelines

**Troubleshoot authentication issues**
1. Check [CREDENTIALS.md](CREDENTIALS.md) - Troubleshooting section
2. Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Troubleshooting section
3. Check [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - User management section

---

## Additional Resources

### Project Documentation

Outside the `docs/` folder:
- **[CLAUDE.md](../CLAUDE.md)** - Project overview and AI assistant instructions
- **[README.md](../README.md)** - Project README with feature overview
- **[specs/](../specs/)** - Detailed specifications and architecture
  - `PRD.json` - 42 functional requirements
  - `architecture.md` - Technical architecture
  - `README.md` - Specifications overview

### External Links

- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Shadcn/ui Components**: https://ui.shadcn.com

---

## Documentation Standards

### For Developers

When creating or updating documentation:

1. **Keep it actionable**: Focus on "how to" rather than theory
2. **Use clear headings**: Make it scannable with good hierarchy
3. **Provide examples**: Include code snippets and SQL queries
4. **Include troubleshooting**: Anticipate common errors
5. **Estimate time**: Help users plan their time
6. **Update timestamps**: Add "Last Updated" date at bottom

### For Security-Sensitive Docs

Files like `CREDENTIALS.md`:
- Never commit real passwords
- Use placeholders (e.g., `your-email@example.com`)
- Add clear security warnings at the top
- Document secure sharing methods
- Include password strength guidelines

### For Operational Docs

Files like `ADMIN_GUIDE.md`:
- Write for non-technical users
- Use screenshots where helpful
- Include step-by-step instructions
- Provide quick reference cards
- Add FAQ section

---

## Contributing to Documentation

If you update code that affects documentation:

1. Update the relevant doc file immediately
2. Check if other docs need updates (cross-references)
3. Update the "Last Updated" timestamp
4. Test all instructions to ensure accuracy
5. Add to this README if you create a new doc

### Creating New Documentation

If you create a new doc:
1. Add it to the appropriate section in this README
2. Follow the documentation standards above
3. Link to it from related documents
4. Add a clear purpose and audience at the top

---

## Support

If you can't find what you're looking for:

1. Check this README index first
2. Use Cmd/Ctrl + F to search within docs
3. Check the main project [CLAUDE.md](../CLAUDE.md)
4. Review [specs/](../specs/) for technical details
5. Check external resources (Supabase docs, etc.)

---

**Total Documentation**: 10 guides covering setup, operations, and technical reference

**Last Updated**: 2026-01-23
**Maintained By**: Pierluigi Baiano
