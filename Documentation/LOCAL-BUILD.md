# Local Development

This document covers local development workflows, including database setup, production build testing, and environment management.

## Table of Contents

1. [Local MongoDB with docker-compose](#1-local-mongodb-with-docker-compose)
2. [Connection Detection (Local vs Firestore)](#2-connection-detection-local-vs-firestore)
3. [Local Build Testing with Standalone Mode](#3-local-build-testing-with-standalone-mode)
4. [Environment Variable Management](#4-environment-variable-management)
5. [Dev Server Workflow](#5-dev-server-workflow)

---

## 1. Local MongoDB with docker-compose

### Start local database

```bash
# From project root
docker-compose up -d
```

### Verify connection

```bash
# Connect with mongo shell
docker exec -it myapp-mongodb mongosh -u admin -p password --authenticationDatabase admin
```

### Connection string

```bash
# .env.local
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
```

---

## 2. Connection Detection (Local vs Firestore)

### Automatic detection in db.ts

```typescript
// src/lib/db.ts
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI

  // Detect environment
  const isFirestore = MONGODB_URI.includes('firestore') ||
                     MONGODB_URI.includes('googleapis.com')
  const isLocal = MONGODB_URI.includes('localhost') ||
                 MONGODB_URI.includes('127.0.0.1') ||
                 MONGODB_URI.includes('mongodb:27017')

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: isLocal ? 1 : 2,
    retryWrites: !isFirestore, // MUST be false for Firestore
    ...(isFirestore && {
      compressors: 'none',
      directConnection: false,
    })
  }

  return mongoose.connect(MONGODB_URI, opts)
}
```

### Why detection matters

- Firestore doesn't support `retryWrites`
- Local MongoDB needs different pool settings
- Logging can be environment-specific

---

## 3. Local Build Testing with Standalone Mode

### Test production build locally

```bash
# Build the standalone output
yarn build:standalone

# Start the production server locally
yarn start:local
```

### Scripts in package.json

```json
{
  "scripts": {
    "build:standalone": "./scripts/build-standalone.sh",
    "start:local": "dotenv -e .env.production.local -- node .next/standalone/server.js"
  }
}
```

### build-standalone.sh

```bash
#!/bin/bash
yarn build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

### Why test standalone locally?

- Verifies production build works
- Tests with production env vars
- Catches standalone-specific issues
- Faster than deploying to test

---

## 4. Environment Variable Management

### Development (.env.local)

```bash
# .env.local (gitignored)
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_POST_HOST=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production local testing (.env.production.local)

```bash
# .env.production.local (gitignored)
NODE_ENV=production
MONGODB_URI=your-firestore-uri
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_POST_HOST=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Example file (.env.example)

```bash
# .env.example (committed to repo)
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_POST_HOST=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Loading priority

1. `.env.production.local` (production mode, local overrides)
2. `.env.local` (local overrides, all environments)
3. `.env.production` / `.env.development` (environment-specific)
4. `.env` (defaults for all environments)

---

## 5. Dev Server Workflow

### Daily development flow

```bash
# 1. Start local MongoDB
docker-compose up -d

# 2. Start Next.js dev server
yarn dev

# 3. Run tests in watch mode (separate terminal)
yarn test:watch

# 4. Type-check (before committing)
yarn type-check

# 5. Lint (before committing)
yarn lint

# 6. Commit (runs all checks automatically)
yarn commit "feat: add new feature"

# 7. Push (runs checks + pushes)
yarn push
```

### Development tools

- Hot reload: Automatic on file changes
- Error overlay: In-browser error display
- React DevTools: Browser extension
- Puppeteer MCP: For visual validation

### Database workflow

```bash
# View MongoDB data
docker exec -it myapp-mongodb mongosh -u admin -p password --authenticationDatabase admin

# Reset database
docker-compose down -v && docker-compose up -d

# Backup local data
docker exec myapp-mongodb mongodump --out /backup

# Restore data
docker exec myapp-mongodb mongorestore /backup
```

---

## Quick Reference

### Common Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start local MongoDB |
| `yarn dev` | Start development server |
| `yarn build:standalone` | Build standalone production bundle |
| `yarn start:local` | Run production build locally |
| `yarn test:watch` | Run tests in watch mode |
| `yarn type-check` | Check TypeScript types |
| `yarn lint` | Run ESLint |
| `yarn commit "message"` | Commit with pre-commit checks |
| `yarn push` | Run checks and push to remote |

### Environment Files

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.local` | Development overrides | Ignored |
| `.env.production.local` | Production testing overrides | Ignored |
| `.env.example` | Template for new developers | Committed |
| `.env` | Default values | Committed |

---

*This documentation is extracted from Section 18 of READ-THIS-FIRST.md*
