# Scraper Domain Integration Guide

This guide shows how to integrate the scraper domain with other parts of the application.

## Integration with Posts Domain

The scraper domain is designed to work seamlessly with the posts domain. Here's how to use it:

### Example 1: Create Post from URL

```typescript
// In posts domain or API route
import { ScraperLogic } from '@/domains/scraper'
import { PostsLogic } from '@/domains/posts'

async function createPostFromUrl(url: string) {
  // Step 1: Scrape the URL
  const scrapeResult = await ScraperLogic.scrapeUrl(url)

  // Step 2: Create post using scraped data
  const post = await PostsLogic.create({
    source: url,
    sourceType: 'url',
    scrapedData: {
      title: scrapeResult.title,
      description: scrapeResult.description,
      content: scrapeResult.content,
      scrapedAt: scrapeResult.scrapedAt,
    },
  })

  return post
}
```

### Example 2: Create Post from Topic Search

```typescript
import { ScraperLogic } from '@/domains/scraper'
import { PostsLogic } from '@/domains/posts'

async function createPostFromTopic(topic: string) {
  // Step 1: Search for the topic
  const searchResult = await ScraperLogic.searchTopic(topic)

  // Step 2: Optionally scrape the first result for more content
  const firstResult = searchResult.results[0]
  let scrapedData = {
    title: firstResult.title,
    description: firstResult.snippet,
    content: firstResult.snippet,
    searchResults: searchResult.results,
  }

  // Optional: Scrape the top result URL for full content
  try {
    const scrapeResult = await ScraperLogic.scrapeUrl(firstResult.url)
    scrapedData = {
      ...scrapedData,
      content: scrapeResult.content,
      fullTitle: scrapeResult.title,
    }
  } catch (error) {
    // Fall back to snippet if scraping fails
    console.warn('Failed to scrape top result:', error)
  }

  // Step 3: Create post using search/scraped data
  const post = await PostsLogic.create({
    source: topic,
    sourceType: 'topic',
    scrapedData,
  })

  return post
}
```

## API Route Integration

### URL Scraping Endpoint

```typescript
// src/app/api/scraper/scrape-url/route.ts
import { NextRequest } from 'next/server'
import { ScraperLogic } from '@/domains/scraper'
import { say, sayError } from '@/lib/responses/say'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return sayError('URL is required', 400)
    }

    const result = await ScraperLogic.scrapeUrl(url)
    return say(result)
  } catch (error) {
    if (error.isBoom) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Internal server error', 500)
  }
}
```

### Topic Search Endpoint

```typescript
// src/app/api/scraper/search-topic/route.ts
import { NextRequest } from 'next/server'
import { ScraperLogic } from '@/domains/scraper'
import { say, sayError } from '@/lib/responses/say'

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

    if (!topic) {
      return sayError('Topic is required', 400)
    }

    const result = await ScraperLogic.searchTopic(topic)
    return say(result)
  } catch (error) {
    if (error.isBoom) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Internal server error', 500)
  }
}
```

## Updated Posts Logic Integration

The posts domain can integrate scraper calls directly in its logic:

```typescript
// Updated PostsLogic in src/domains/posts/logic.ts
import { ScraperLogic } from '@/domains/scraper'

export const PostsLogic = {
  async create(input: CreatePostInput): Promise<Post> {
    const { source, sourceType, scrapedData: providedData } = input

    let scrapedData = providedData

    // If scraped data not provided, scrape it now
    if (!scrapedData) {
      if (sourceType === 'url') {
        const scrapeResult = await ScraperLogic.scrapeUrl(source)
        scrapedData = {
          title: scrapeResult.title,
          description: scrapeResult.description,
          content: scrapeResult.content,
          scrapedAt: scrapeResult.scrapedAt,
        }
      } else if (sourceType === 'topic') {
        const searchResult = await ScraperLogic.searchTopic(source)
        const firstResult = searchResult.results[0]

        scrapedData = {
          title: firstResult.title,
          description: firstResult.snippet,
          content: firstResult.snippet,
          searchResults: searchResult.results,
        }
      }
    }

    // Generate posts for all platforms
    const generatedPosts = await PostsLogic.generatePosts(
      source,
      sourceType,
      scrapedData
    )

    // Save to database
    return PostsDal.create({
      source,
      sourceType,
      scrapedData,
      platforms: generatedPosts.reduce((acc, { platform, content }) => {
        acc[platform] = { content }
        return acc
      }, {} as Record<Platform, { content: string }>),
    })
  },
}
```

## Error Handling

The scraper domain uses Boom errors that should be caught and handled appropriately:

```typescript
import { ScraperLogic } from '@/domains/scraper'
import * as Boom from '@hapi/boom'

try {
  const result = await ScraperLogic.scrapeUrl(url)
  // Success
} catch (error) {
  if (Boom.isBoom(error)) {
    // Handle Boom errors
    const statusCode = error.output.statusCode
    const message = error.message

    if (statusCode === 400) {
      // Bad request - invalid URL
    } else if (statusCode === 502) {
      // Bad gateway - fetch/parse error
    } else if (statusCode === 404) {
      // Not found - no search results
    }
  } else {
    // Handle unexpected errors
  }
}
```

## Performance Considerations

### Caching

For frequently accessed URLs or topics, implement caching:

```typescript
import { ScraperLogic } from '@/domains/scraper'

const scrapeCache = new Map<string, any>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function scrapeWithCache(url: string) {
  const cached = scrapeCache.get(url)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const result = await ScraperLogic.scrapeUrl(url)

  scrapeCache.set(url, {
    data: result,
    timestamp: Date.now(),
  })

  return result
}
```

### Rate Limiting

Implement rate limiting for scraping operations:

```typescript
import { ScraperLogic } from '@/domains/scraper'

const rateLimitMap = new Map<string, number[]>()
const MAX_REQUESTS_PER_MINUTE = 10

async function scrapeWithRateLimit(url: string) {
  const domain = new URL(url).hostname
  const now = Date.now()
  const requests = rateLimitMap.get(domain) || []

  // Remove requests older than 1 minute
  const recentRequests = requests.filter(
    (time) => now - time < 60 * 1000
  )

  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error('Rate limit exceeded for this domain')
  }

  recentRequests.push(now)
  rateLimitMap.set(domain, recentRequests)

  return ScraperLogic.scrapeUrl(url)
}
```

## Testing

### Unit Testing Scraper Domain

```typescript
// src/domains/scraper/__tests__/logic.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ScraperLogic } from '../logic'

describe('ScraperLogic.scrapeUrl', () => {
  it('should scrape a valid URL', async () => {
    const result = await ScraperLogic.scrapeUrl('https://example.com')

    expect(result).toMatchObject({
      url: 'https://example.com',
      title: expect.any(String),
      description: expect.any(String),
      content: expect.any(String),
      scrapedAt: expect.any(Date),
    })
  })

  it('should throw error for invalid URL', async () => {
    await expect(
      ScraperLogic.scrapeUrl('not-a-url')
    ).rejects.toThrow('Invalid URL format')
  })

  it('should throw error for non-http(s) protocol', async () => {
    await expect(
      ScraperLogic.scrapeUrl('ftp://example.com')
    ).rejects.toThrow('URL must use http or https protocol')
  })
})
```

### Integration Testing

```typescript
// src/domains/posts/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest'
import { PostsLogic } from '../logic'
import { ScraperLogic } from '@/domains/scraper'

describe('Posts Integration with Scraper', () => {
  it('should create post from URL', async () => {
    const post = await PostsLogic.create({
      source: 'https://example.com',
      sourceType: 'url',
    })

    expect(post).toMatchObject({
      source: 'https://example.com',
      sourceType: 'url',
      scrapedData: expect.objectContaining({
        title: expect.any(String),
        content: expect.any(String),
      }),
    })
  })

  it('should create post from topic', async () => {
    const post = await PostsLogic.create({
      source: 'web development',
      sourceType: 'topic',
    })

    expect(post).toMatchObject({
      source: 'web development',
      sourceType: 'topic',
      scrapedData: expect.objectContaining({
        searchResults: expect.any(Array),
      }),
    })
  })
})
```
