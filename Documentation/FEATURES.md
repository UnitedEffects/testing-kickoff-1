# Feature Architecture Patterns

Features contain **UI and presentation logic**. They orchestrate domains but never contain business logic.

## Feature Directory Structure

```
src/features/[feature]/
├── components/          # React components
│   ├── FeaturePage.tsx  # Main component (server component)
│   ├── ClientComponent.tsx   # Client component
│   └── Section.tsx
├── hooks/               # Client-side hooks (must use 'use client')
│   ├── useFeature.ts
│   └── useFeatureAction.ts
├── controllers/         # Server-side data fetching
│   └── controller.ts
├── utils/               # Feature-specific utilities
│   └── helpers.ts
├── __tests__/           # Feature tests
│   ├── FeaturePage.test.tsx
│   └── hooks.test.ts
└── index.ts             # Public exports
```

## Feature Subdirectories

### components/
React components (server or client)
- Server components by default
- Client components marked with `'use client'`
- No direct domain imports allowed

### hooks/
Client-side React hooks
- Always `'use client'`
- Call APIs via fetch, never import domain logic
- Handle loading states, errors, local state

### controllers/
Server-side data fetching
- Fetch from domain APIs (internal fetch)
- Transform data for UI consumption
- Handle errors, return consistent shapes

### utils/
Feature-specific utilities
- Formatters, validators, helpers
- Only used within this feature

### models/
Feature-specific types
- UI state types, form types
- Distinct from domain types

## Feature Exports (index.ts)

```typescript
// src/features/[feature]/index.ts
export { FeaturePage } from './components/FeaturePage'
export { useFeature } from './hooks/useFeature'
export { controller } from './controllers/controller'
```

## Feature-to-Domain Communication

### ✅ CORRECT - Features use APIs

```typescript
// src/features/[feature]/hooks/useFeature.ts
// Example: "posts" is a domain, not a requirement
'use client'

export function useFeature() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchItems() {
      const response = await fetch('/api/[domain]')
      const data = await response.json()
      setItems(data)
      setLoading(false)
    }
    fetchItems()
  }, [])

  return { items, loading }
}
```

### ❌ FORBIDDEN - Direct domain imports

```typescript
// ❌ NEVER DO THIS
import { DomainLogic } from '@/domains/[domain]/logic'
```

## Client Components with Hooks Pattern

### Server Component (default)

```typescript
// src/features/[feature]/components/FeaturePage.tsx
import { controller } from '../controllers/controller'
import { ClientComponent } from './ClientComponent'

export async function FeaturePage() {
  const data = await controller.getData()

  return (
    <div>
      <ClientComponent data={data} />
    </div>
  )
}
```

### Client Component

```typescript
// src/features/[feature]/components/ClientComponent.tsx
'use client'

import { useFeature } from '../hooks/useFeature'

export function ClientComponent({ data }) {
  const { handleAction, loading } = useFeature()

  return (
    <section>
      <h1>{data.title}</h1>
      <button onClick={handleAction} disabled={loading}>
        Submit
      </button>
    </section>
  )
}
```

## PageLoader Pattern (Prevent FOUC)

**REQUIRED pattern for all pages:**

```typescript
// src/features/[feature]/components/FeaturePage.tsx
'use client'

import { useState, useEffect } from 'react'
import { PageLoader } from '@/shared/components/PageLoader'
import { useFeaturePage } from '../hooks/useFeaturePage'

export function FeaturePage() {
  const [isLoading, setIsLoading] = useState(true)
  const { data, loading: dataLoading } = useFeaturePage()

  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false)
    }
  }, [dataLoading])

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      {/* Page content */}
    </div>
  )
}
```

### PageLoader Component

```typescript
// src/shared/components/PageLoader.tsx
export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
}
```

## Key Principles

1. **Features are UI-focused** - Presentation, user interactions, data formatting for display
2. **No business logic** - All business rules belong in domains
3. **API communication only** - Never import domain logic directly
4. **Server components first** - Use client components only when needed for interactivity
5. **Type safety** - Use TypeScript types from domain schemas
6. **Testable** - Component tests, hook tests, integration tests
