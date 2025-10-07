# Authentication & Authorization

This document outlines the authentication and authorization patterns used in this application. These patterns demonstrate authentication using **Clerk** as a reference implementation, but the architectural principles apply universally to other auth solutions (NextAuth.js, Auth0, Supabase Auth, custom JWT, etc.).

## Architectural Principles

When adapting to a different auth solution, maintain these core patterns:

- **Middleware setup**: Apply similar route protection logic
- **Route wrappers**: Implement equivalent auth checking functions
- **Role-based access**: Adapt role extraction and verification
- **Session management**: Use your provider's session/token patterns
- **Auth headers**: Maintain consistent header injection for APIs

The architectural principles (middleware protection, route wrappers, role-based access, bearer tokens for APIs) apply universally across auth providers.

---

## Table of Contents

- [1. Clerk Middleware Setup](#1-clerk-middleware-setup)
- [2. Route Protection Patterns](#2-route-protection-patterns)
- [3. Auth Header Injection for APIs](#3-auth-header-injection-for-apis)
- [4. Auth Context Utilities](#4-auth-context-utilities)
- [5. Route Wrappers](#5-route-wrappers)
- [6. Bearer Token vs Session Cookie Patterns](#6-bearer-token-vs-session-cookie-patterns)
- [7. Role Extraction from Session Claims](#7-role-extraction-from-session-claims)

---

## 1. Clerk Middleware Setup

The middleware handles authentication at the edge, protecting routes and injecting auth headers for downstream use.

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/blog(.*)',
  '/api/health',
  '/api/openapi',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Public routes - allow all
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Protected routes - require auth
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Admin routes - require admin role
  if (isAdminRoute(req)) {
    const roles = (sessionClaims?.metadata as any)?.roles || []
    if (!roles.includes('admin') && !roles.includes('community_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
  }

  // Inject user ID header for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', userId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

---

## 2. Route Protection Patterns

Define route groups to organize protection levels:

```typescript
const PROTECTED_ROUTES = [
  '/dashboard(.*)',
  '/settings(.*)',
  '/api/posts',
]

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/blog(.*)',
  '/api/health',
]

const ADMIN_ROUTES = [
  '/admin(.*)',
  '/api/admin(.*)',
]
```

---

## 3. Auth Header Injection for APIs

The middleware injects authentication headers for API routes, making auth context available to handlers.

**Middleware implementation:**
```typescript
// Middleware injects x-user-id header
if (req.nextUrl.pathname.startsWith('/api')) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', userId)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}
```

**Usage in API handlers:**
```typescript
// src/domains/posts/api.ts
async function createHandler(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!  // Guaranteed by middleware
  // ... use userId
}
```

---

## 4. Auth Context Utilities

Helper functions to extract auth information from injected headers:

```typescript
// src/lib/auth/index.ts
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import Boom from '@hapi/boom'

export interface AuthContext {
  userId: string | null
  sessionId: string | null
  role: string | null
}

/**
 * Extract authentication context from request headers
 * These headers are set by the middleware for API routes
 */
export async function getAuthContext(): Promise<AuthContext> {
  const headersList = await headers()

  return {
    userId: headersList.get('x-user-id'),
    sessionId: headersList.get('x-session-id'),
    role: headersList.get('x-user-role'),
  }
}

/**
 * Get auth context directly from Clerk (useful for pages/components)
 * This bypasses the middleware headers and gets fresh data
 */
export async function getAuthContextDirect(): Promise<AuthContext> {
  const authState = await auth()

  return {
    userId: authState.userId,
    sessionId: authState.sessionId,
    role: getRoleFromSessionClaims(authState.sessionClaims) ?? null,
  }
}

/**
 * Require authentication or throw an error
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext()

  if (!auth.userId) {
    throw Boom.unauthorized('Authentication required')
  }

  return auth
}

/**
 * Get optional auth context without requiring authentication
 * Useful for endpoints with different behavior for authenticated vs anonymous users
 */
export async function getOptionalAuthContext() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const sessionId = headersList.get('x-session-id')
  const role = headersList.get('x-user-role')

  return {
    userId: userId || undefined,
    sessionId: sessionId || undefined,
    role: role || undefined,
    isAdmin: role === 'community_admin',
    isAuthenticated: !!userId
  }
}
```

### Usage in Domain Logic

```typescript
// src/domains/[domain]/logic.ts
import { getAuthContext, requireAuth } from '@/lib/auth'

export const DomainLogic = {
  async create(data: CreateDto) {
    const { userId } = await requireAuth()  // Throws if not authenticated

    return DomainDal.create({
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    })
  },

  async list() {
    const auth = await getOptionalAuthContext()

    // Different behavior based on auth state
    if (auth.isAuthenticated) {
      return DomainDal.listAll()
    } else {
      return DomainDal.listPublic()
    }
  }
}
```

---

## 5. Route Wrappers

Higher-order functions to apply authentication and authorization checks to route handlers:

```typescript
// src/lib/auth/route-wrappers.ts
import { NextRequest } from 'next/server'
import { sayError } from '@/lib/responses/say'

export function withAuth<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const [req] = args as [NextRequest]
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return sayError('Unauthorized', 401)
    }

    return handler(...args)
  }) as T
}

export function withRole<T extends (...args: any[]) => any>(
  roles: string[],
  handler: T
): T {
  return (async (...args: any[]) => {
    const [req] = args as [NextRequest]
    const userId = req.headers.get('x-user-id')
    const userRoles = req.headers.get('x-user-roles')?.split(',') || []

    if (!userId) {
      return sayError('Unauthorized', 401)
    }

    const hasRole = roles.some(role => userRoles.includes(role))
    if (!hasRole) {
      return sayError('Forbidden: Insufficient permissions', 403)
    }

    return handler(...args)
  }) as T
}

export function withPublic<T extends (...args: any[]) => any>(handler: T): T {
  return handler  // No auth check
}

export function withOptionalAPIAuth<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: any[]) => {
    // Allow both authenticated and unauthenticated requests
    // Handler can check for x-user-id to provide different responses
    return handler(...args)
  }) as T
}
```

### Usage Example

```typescript
// src/domains/posts/api.ts
export const postsApi = {
  list: withAuth(listHandler),              // Requires auth
  create: withRole(['admin'], createHandler), // Requires admin role
  getPublic: withPublic(getPublicHandler),   // Public endpoint
}
```

---

## 6. Bearer Token vs Session Cookie Patterns

### API Routes (Bearer Tokens)

API routes use bearer tokens for stateless authentication:

```typescript
// Client sends Authorization header
fetch('/api/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
```

### UI Routes (Session Cookies)

UI routes use session cookies for browser-based authentication:

- Clerk automatically manages session cookies
- No manual token handling needed
- Middleware reads session from cookie

### Why Different Patterns?

- **APIs**: Stateless, token-based (mobile apps, external clients)
- **UI**: Session-based (browser, automatic cookie handling)

---

## 7. Role Extraction from Session Claims

Roles are extracted from session claims and injected as headers for downstream use:

```typescript
// Middleware extracts roles
const roles = (sessionClaims?.metadata as any)?.roles || []

// Inject roles header for API routes
if (req.nextUrl.pathname.startsWith('/api')) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', userId)
  requestHeaders.set('x-user-roles', roles.join(','))
  return NextResponse.next({ request: { headers: requestHeaders } })
}
```

### Clerk Configuration

Configure Clerk in the Dashboard:
- Session token must include `metadata` in claims
- User metadata structure: `{ roles: ['admin', 'user'] }`

---

## Summary

This authentication architecture provides:

1. **Edge-level protection** via middleware for all routes
2. **Header injection** for seamless auth context in API routes
3. **Flexible utilities** for both required and optional authentication
4. **Route wrappers** for declarative auth requirements
5. **Role-based access control** with session claim integration
6. **Dual patterns** supporting both API (bearer) and UI (session) authentication

These patterns can be adapted to any authentication provider while maintaining the same architectural benefits.
