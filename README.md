# Project Specifications

Documentation hub for Giuliana's 40th Birthday Guestbook.

## Quick Links

- **[../CLAUDE.md](../CLAUDE.md)** - Main entry point, setup, quick reference
- **[PRD.json](PRD.json)** - 42 functional requirements with acceptance criteria
- **[architecture.md](architecture.md)** - Technical architecture, database schema, auth flows

## Document Purpose

### CLAUDE.md (Main Entry Point)
- **Audience**: AI assistant, developers
- **Purpose**: Quick reference, setup commands, project overview
- **Language**: English (by convention)
- **Length**: ~150 lines
- **Updates**: When tech stack or key decisions change

### PRD.json (Product Requirements)
- **Audience**: Developers, QA testers
- **Purpose**: Detailed functional requirements, acceptance criteria, testing steps
- **Format**: Structured JSON (42 requirements)
- **Length**: ~1500 lines
- **Updates**: When features added/modified, `passes: false → true` when tested

### architecture.md (Technical Design)
- **Audience**: Developers, architects
- **Purpose**: System design, database schema, code examples, deployment
- **Length**: ~800 lines
- **Updates**: When architecture changes (rarely after initial design)

## Token Optimization (Ralph System)

To reduce token usage in AI conversations:

1. **Reference, don't repeat**: Link between docs instead of duplicating
2. **Modular structure**: Separate concerns (setup vs requirements vs architecture)
3. **Entry point pattern**: CLAUDE.md points to other docs, AI reads only what's needed
4. **Structured data**: PRD.json allows programmatic parsing vs prose

**Example**:
Instead of repeating database schema in CLAUDE.md:
```markdown
See database schema → [specs/architecture.md#database-schema](architecture.md#database-schema)
```

## File Organization

```
specs/
├── README.md           # This file (index/navigation)
├── PRD.json            # Requirements (machine + human readable)
└── architecture.md     # Technical design (human readable)

../
├── CLAUDE.md           # Entry point for AI assistant
└── README.md           # (Future) User-facing project README
```

## Maintenance

- **CLAUDE.md**: Update for major changes only (stack, commands, priorities)
- **PRD.json**: Update `passes` field as requirements are tested
- **architecture.md**: Reference document, minimal updates post-implementation
- **This README**: Update when adding new spec documents

## Related Documentation (Post-Implementation)

- `docs/ADMIN_GUIDE.md` - Admin operations manual (Italian)
- `docs/DEPLOYMENT.md` - Deploy checklist and troubleshooting
- `docs/API.md` - API routes documentation (if needed)
