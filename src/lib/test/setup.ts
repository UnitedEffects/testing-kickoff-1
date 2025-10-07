import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
