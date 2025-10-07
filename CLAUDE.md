# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains **scaffolding documentation** for initializing new Next.js 15+ TypeScript projects using UEV (United Effects Ventures) Architecture Patterns. This is NOT a working application—it's a guide for project initialization.

**Key file**: `READ-THIS-FIRST.md` (146KB) contains the complete scaffolding specification.

## Project Initialization Workflow

When a user runs `/init` or explicitly asks to scaffold a new project:

### 1. Read the Complete Specification
- Read `READ-THIS-FIRST.md` completely to understand all architectural patterns
- This document defines Next.js 15+, TypeScript, App Router patterns with domain-driven architecture

### 2. Create Documentation Structure
Create `Documentation/` directory with these files (extract content from READ-THIS-FIRST.md):
- **FEATURES.md** - Feature layer architecture (Section 5)
- **DOMAINS.md** - Domain-driven design patterns (Section 6)
- **AUTH.md** - Authentication patterns (Section 9)
- **DB.md** - Database patterns (Section 8)
- **SECTIONS.md** - Reusable section components (Section 15)
- **DESIGN.md** - Styling system (Section 12)
- **MCP.md** - Model Context Protocol integration (Section 20, if needed)
- **LOCAL-BUILD.md** - Local production testing (Section 18)
- **PROGRESS.md** - Session history tracking

### 3. Create CLAUDE.md
- Project-specific instructions derived from this document
- Adapted to reference implementations
- References to Documentation/*.md files to avoid redundancy

### 4. Interview the User
Ask about:
- What they want to build
- Stack preferences (auth provider, database, styling)
- Whether to run `node scripts/project-kickoff.js` for interactive package.json creation
- Specific requirements or existing documentation

### 5. Clarify Stack Choices
The architecture is flexible on implementation details:

**Fixed (Required)**:
- Next.js 15+ with App Router
- TypeScript strict mode
- React 19+
- Node.js 24.4.1+
- Yarn 4+ package manager
- Layer separation: App Router → Features → Domains → Database

**Flexible (Reference implementations provided)**:
- **Auth**: Clerk (reference), but supports NextAuth.js, Auth0, Supabase Auth, custom JWT
- **Database**: MongoDB + Mongoose (reference), but supports PostgreSQL + Prisma, Supabase, Drizzle
- **Styling**: Tailwind CSS v4 (optional), any styling solution works
- **API**: OpenAPI + REST (recommended), but GraphQL/tRPC viable
- **Testing**: Vitest + React Testing Library (recommended)

### 6. Scaffold the Project
Follow the checklist from READ-THIS-FIRST.md Section 0:
- Create folder structure (Section 1)
- Initialize package manager (Yarn 4)
- Configure TypeScript, Next.js, ESLint (Sections 2, 13)
- Set up testing infrastructure (Section 4)
- Configure styling system (Section 12)
- Create git workflow scripts (Section 3: `commit.sh`, `push.sh`)
- Wire package.json scripts
- Create App Router structure (Section 7)
- Create first domain example (Section 6)
- Create first feature example (Section 5)
- Generate project-specific README.md
- Validate: run dev server, tests, lint, type-check

## Architecture Quick Reference

### Layer Structure
```
App Router (src/app/) - Thin wrappers, route handlers
    ↓ calls
Features (src/features/) - UI/presentation, React components
    ↓ calls via fetch/API
Domains (src/domains/) - Business logic, UI-agnostic
    ↓ calls
Database - Data persistence layer
```

### Critical Rules
1. **Features NEVER import domain logic directly** - always use API routes
2. **App Router pages are thin** - delegate to features or domain APIs
3. **Domain layer is UI-agnostic** - no React, no Next.js dependencies
4. **Use yarn, NEVER npm** - project uses Yarn 4+
5. **Test before commit** - `commit.sh` and `push.sh` enforce validation

### Domain Structure
Each domain in `src/domains/[domain]/`:
- `api.ts` - HTTP handlers (exported for App Router)
- `logic.ts` - Business logic and validation
- `dal.ts` - Data access layer (database queries)
- `models.ts` - Database schemas + TypeScript types
- `schema.ts` - OpenAPI schemas (request/response DTOs)
- `__tests__/` - Domain unit tests

### Feature Structure
Each feature in `src/features/[feature]/`:
- `components/` - React components (server + client)
- `hooks/` - Client-side hooks (`'use client'`)
- `controllers/` - Server-side data fetching
- `utils/` - Feature-specific utilities
- `__tests__/` - Component and integration tests

## Common Development Commands

```bash
# Development
yarn dev                    # Start dev server
yarn build                  # Production build
yarn build:standalone       # Build with static assets
yarn start:local            # Test production build locally

# Testing
yarn test                   # Run tests once
yarn test:watch             # Watch mode
yarn test:coverage          # With coverage

# Code Quality
yarn lint                   # ESLint
yarn type-check             # TypeScript validation

# Git Workflow (with validation)
yarn commit "message"       # Runs tests + lint + type-check before commit
yarn push                   # Runs validation + pushes to feature branch
```

## Important Notes

### Node Version
Always use Node.js 24.4.1+:
```bash
nvm use  # Uses version from .nvmrc
```

### Package Manager
**CRITICAL**: Always use `yarn`, NEVER `npm`:
```bash
✅ yarn add package-name
✅ yarn install
❌ npm install package-name
```

### Git Workflow
- `commit.sh` - Validates tests, lint, type-check before committing
- `push.sh` - Prevents direct pushes to main/master, requires feature branches
- Scripts located in `scripts/` directory, make executable with `chmod +x`

### Testing Approach
- TDD for large features: Write tests → Implement → Refactor
- Small changes: Implement → Test immediately
- Use Puppeteer (via MCP) for UI validation
- Tests belong in domain/feature `__tests__/` directories, NOT in `src/app/__tests__/`

### Authentication Patterns
- Middleware injects user context via headers (`x-user-id`, `x-user-role`, etc.)
- Route wrappers: `withAuth()`, `withRole(['admin'])`, `withPublic()`
- Bearer tokens for API routes, session cookies for UI routes

### Shared Resources
Only create `src/shared/` for code used by 2+ features/domains:
- `shared/components/` - Including required `PageLoader.tsx`
- `shared/hooks/`
- `shared/utils/` - Including `odata.ts`, `site-metadata.ts`
- `shared/schemas/` - Common API schemas
- `shared/types/` - Shared TypeScript types

### Environment Variables
Always create `.env.example` documenting all required variables:
- Database connection strings
- Auth provider keys
- Application URLs
- Feature flags

## When User Asks to Initialize

1. **Read**: Complete READ-THIS-FIRST.md (may need multiple reads due to size)
2. **Create Documentation/**: Extract sections to create all Documentation/*.md files
3. **Create CLAUDE.md**: Project-specific instructions (this file)
4. **Interview**: Ask user about their project requirements
5. **Confirm**: Stack choices and architecture decisions
6. **Execute**: Follow the scaffolding checklist
7. **Validate**: Ensure dev server, tests, lint, and type-check all pass
8. **Commit**: Use `yarn commit` for initial commit (with user approval)

## Reference Implementation Examples

The documentation uses "posts" domain throughout as an illustration (with fields like `title`, `slug`, `content`, `authorId`). This is NOT a requirement—it simply demonstrates the architecture patterns. Replace with actual project domains.

## Documentation Structure

After initialization, the `Documentation/` folder will contain detailed guides for:
- Feature architecture and component patterns
- Domain-driven design implementation
- Authentication and authorization
- Database patterns and connection management
- Reusable section components
- Styling system configuration
- MCP integration (optional)
- Local production testing workflows

## Quick Start Script

The repository includes `scripts/project-kickoff.js` which interactively creates:
- `package.json` with essential project info
- `.nvmrc` for Node.js version management
- Optional git initialization

Run with: `node scripts/project-kickoff.js`
