# Scraper Domain

A utility domain for web scraping and topic searching functionality. This domain provides business logic for extracting content from URLs and searching the web for topics.

## Overview

The scraper domain is a **utility domain** - it provides reusable functions without database persistence or API routes. It follows the domain-driven design pattern but only includes business logic.

## Files

- **logic.ts** - Core scraping and searching business logic
- **index.ts** - Public exports

## Features

### 1. URL Scraping (`scrapeUrl`)

Scrapes a URL and extracts structured content including:
- Page title (from meta tags or `<title>`)
- Meta description (from Open Graph, Twitter Card, or meta description)
- Text content (cleaned, whitespace-normalized, max 5000 chars)
- Original URL
- Timestamp

**Usage:**

```typescript
import { ScraperLogic } from '@/domains/scraper'

const result = await ScraperLogic.scrapeUrl('https://example.com')
// Returns: ScrapeResult
```

**Error Handling:**
- Validates URL format and protocol (http/https only)
- Checks content type (HTML required)
- Throws `Boom.badRequest` for invalid input
- Throws `Boom.badGateway` for fetch/parsing failures

### 2. Topic Search (`searchTopic`)

Searches the web for a topic using DuckDuckGo and returns structured results:
- Search query used
- Array of search results (title, URL, snippet)
- Timestamp
- Limited to top 10 results

**Usage:**

```typescript
import { ScraperLogic } from '@/domains/scraper'

const result = await ScraperLogic.searchTopic('web scraping')
// Returns: SearchResult
```

**Error Handling:**
- Validates topic length (2-500 characters)
- Throws `Boom.badRequest` for invalid input
- Throws `Boom.notFound` if no results found
- Throws `Boom.badGateway` for search failures

## Types

### ScrapeResult

```typescript
interface ScrapeResult {
  url: string          // The URL that was scraped
  title: string        // Page title
  description: string  // Meta description
  content: string      // Extracted text (max 5000 chars)
  scrapedAt: Date     // Timestamp
}
```

### SearchResult

```typescript
interface SearchResult {
  query: string                  // Search query used
  results: SearchResultItem[]    // Array of results
  searchedAt: Date              // Timestamp
}

interface SearchResultItem {
  title: string    // Result title
  url: string      // Result URL
  snippet: string  // Description/snippet
}
```

## Implementation Details

### URL Scraping

1. **URL Validation**: Validates format and ensures http/https protocol
2. **Fetching**: Uses native `fetch` with custom User-Agent
3. **Content Type Check**: Ensures HTML content
4. **Parsing**: Uses Cheerio to parse HTML DOM
5. **Extraction**:
   - Title from Open Graph, Twitter Card, or `<title>` tag
   - Description from meta tags (multiple sources)
   - Text from `<body>` after removing scripts, styles, nav, etc.
6. **Cleaning**: Normalizes whitespace, limits to 5000 characters

### Topic Searching

1. **Input Validation**: Checks topic length (2-500 chars)
2. **Search**: Uses DuckDuckGo HTML search (no API key required)
3. **Parsing**: Extracts results using Cheerio selectors
4. **URL Extraction**: Handles DuckDuckGo redirect URLs
5. **Limiting**: Returns max 10 results

## Dependencies

- **cheerio** (v1.0.0) - HTML parsing and DOM traversal
- **@hapi/boom** (v10.0.1) - HTTP error handling

## Error Handling Pattern

All functions follow consistent error handling:

```typescript
try {
  // Operation logic
} catch (error) {
  // Re-throw Boom errors as-is
  if (Boom.isBoom(error)) {
    throw error
  }
  // Wrap unknown errors in Boom
  throw Boom.badGateway(`Failed to ...: ${error.message}`)
}
```

## Integration Example

This domain is designed to be used by other domains or API routes:

```typescript
// In another domain (e.g., posts)
import { ScraperLogic } from '@/domains/scraper'

export const PostsLogic = {
  async createFromUrl(url: string) {
    // Scrape the URL
    const scrapeResult = await ScraperLogic.scrapeUrl(url)

    // Use scraped data to create post
    return PostsDal.create({
      title: scrapeResult.title,
      content: scrapeResult.content,
      source: url,
      // ... other fields
    })
  },

  async createFromTopic(topic: string) {
    // Search for topic
    const searchResult = await ScraperLogic.searchTopic(topic)

    // Use first result or aggregate results
    // ... create post logic
  }
}
```

## Testing

The domain can be tested in isolation since it has no database dependencies:

```typescript
import { describe, it, expect } from 'vitest'
import { ScraperLogic } from './logic'

describe('ScraperLogic', () => {
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

  it('should search for a topic', async () => {
    const result = await ScraperLogic.searchTopic('test query')

    expect(result).toMatchObject({
      query: 'test query',
      results: expect.any(Array),
      searchedAt: expect.any(Date),
    })
    expect(result.results.length).toBeGreaterThan(0)
  })
})
```

## Limitations

1. **Rate Limiting**: No built-in rate limiting - implement at the caller level
2. **Content Size**: Text content limited to 5000 characters
3. **Search Results**: Limited to 10 results from DuckDuckGo
4. **JavaScript**: Cannot scrape JavaScript-rendered content (requires static HTML)
5. **Authentication**: Cannot scrape pages requiring authentication

## Future Enhancements

- Add support for JavaScript-rendered pages (Puppeteer/Playwright)
- Implement caching for scraped content
- Add support for different search engines
- Extract structured data (JSON-LD, microdata)
- Support for RSS/Atom feed parsing
