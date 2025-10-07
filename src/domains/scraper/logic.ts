/**
 * Scraper Domain - Business Logic
 *
 * Handles URL scraping and topic searching functionality.
 * This is a utility domain without database persistence.
 */

import * as cheerio from 'cheerio'
import * as Boom from '@hapi/boom'

/**
 * Result from scraping a URL
 */
export interface ScrapeResult {
  /** URL that was scraped */
  url: string
  /** Page title */
  title: string
  /** Meta description */
  description: string
  /** Extracted text content (first 5000 characters) */
  content: string
  /** Timestamp when scraped */
  scrapedAt: Date
}

/**
 * Single search result from topic search
 */
export interface SearchResultItem {
  /** Title of the search result */
  title: string
  /** URL of the search result */
  url: string
  /** Snippet/description from search result */
  snippet: string
}

/**
 * Result from searching a topic
 */
export interface SearchResult {
  /** Search query that was used */
  query: string
  /** Array of search results */
  results: SearchResultItem[]
  /** Timestamp when searched */
  searchedAt: Date
}

/**
 * Scraper business logic
 */
export const ScraperLogic = {
  /**
   * Scrapes a URL and extracts text content, title, and meta description
   *
   * @param url - The URL to scrape
   * @returns Structured scrape result with extracted data
   * @throws {Boom.badRequest} If URL is invalid
   * @throws {Boom.badGateway} If fetch fails or content cannot be parsed
   */
  async scrapeUrl(url: string): Promise<ScrapeResult> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw Boom.badRequest('URL is required and must be a string')
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw Boom.badRequest('URL must use http or https protocol')
      }
    } catch (error) {
      throw Boom.badRequest('Invalid URL format')
    }

    try {
      // Fetch the URL
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialPostGenerator/1.0)',
        },
        // Prevent following too many redirects
        redirect: 'follow',
      })

      if (!response.ok) {
        throw Boom.badGateway(
          `Failed to fetch URL: ${response.status} ${response.statusText}`
        )
      }

      // Get content type
      const contentType = response.headers.get('content-type') || ''

      if (!contentType.includes('text/html')) {
        throw Boom.badRequest(
          `URL must return HTML content, got: ${contentType}`
        )
      }

      // Get the HTML content
      const html = await response.text()

      // Parse with cheerio
      const $ = cheerio.load(html)

      // Extract title (try multiple sources)
      const title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text() ||
        'Untitled'

      // Extract description (try multiple sources)
      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        ''

      // Remove script, style, and other non-content elements
      $('script, style, nav, header, footer, aside, iframe, noscript').remove()

      // Extract text content from body
      const bodyText = $('body').text()

      // Clean up whitespace
      const cleanedText = bodyText
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim()

      // Limit content to first 5000 characters to prevent huge payloads
      const content = cleanedText.length > 5000
        ? cleanedText.substring(0, 5000) + '...'
        : cleanedText

      if (!content || content.length < 10) {
        throw Boom.badGateway('No meaningful content could be extracted from URL')
      }

      return {
        url: parsedUrl.toString(),
        title: title.trim(),
        description: description.trim(),
        content,
        scrapedAt: new Date(),
      }
    } catch (error) {
      // Re-throw Boom errors
      if (Boom.isBoom(error)) {
        throw error
      }

      // Wrap other errors
      throw Boom.badGateway(
        `Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },

  /**
   * Searches the web for a topic using DuckDuckGo HTML search
   *
   * @param topic - The topic to search for
   * @returns Search results with URLs and snippets
   * @throws {Boom.badRequest} If topic is invalid
   * @throws {Boom.badGateway} If search fails
   */
  async searchTopic(topic: string): Promise<SearchResult> {
    // Validate topic
    if (!topic || typeof topic !== 'string') {
      throw Boom.badRequest('Topic is required and must be a string')
    }

    const trimmedTopic = topic.trim()

    if (trimmedTopic.length < 2) {
      throw Boom.badRequest('Topic must be at least 2 characters long')
    }

    if (trimmedTopic.length > 500) {
      throw Boom.badRequest('Topic must be less than 500 characters')
    }

    try {
      // Use DuckDuckGo HTML search (no API key required)
      const searchUrl = new URL('https://html.duckduckgo.com/html/')
      searchUrl.searchParams.set('q', trimmedTopic)

      const response = await fetch(searchUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialPostGenerator/1.0)',
        },
      })

      if (!response.ok) {
        throw Boom.badGateway(
          `Search request failed: ${response.status} ${response.statusText}`
        )
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Parse DuckDuckGo results
      const results: SearchResultItem[] = []

      // DuckDuckGo HTML results are in .result class
      $('.result').each((_, element) => {
        const $result = $(element)

        // Get the link
        const $link = $result.find('.result__a')
        const title = $link.text().trim()
        const href = $link.attr('href')

        // Get the snippet
        const snippet = $result.find('.result__snippet').text().trim()

        // Validate and add result
        if (title && href && snippet) {
          try {
            // DuckDuckGo uses redirect URLs, extract the actual URL
            const actualUrl = new URL(href, searchUrl)
            const uddgParam = actualUrl.searchParams.get('uddg')
            const finalUrl = uddgParam || href

            results.push({
              title,
              url: finalUrl,
              snippet,
            })
          } catch (error) {
            // Skip invalid URLs
            console.error('Failed to parse search result URL:', error)
          }
        }

        // Limit to 10 results
        if (results.length >= 10) {
          return false // Break the .each loop
        }
      })

      if (results.length === 0) {
        throw Boom.notFound('No search results found for the given topic')
      }

      return {
        query: trimmedTopic,
        results,
        searchedAt: new Date(),
      }
    } catch (error) {
      // Re-throw Boom errors
      if (Boom.isBoom(error)) {
        throw error
      }

      // Wrap other errors
      throw Boom.badGateway(
        `Failed to search topic: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },
}
