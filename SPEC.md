Project Overview
Create a standalone npm package that provides a generic TypeScript RSS feed reader with Puppeteer-based scraping for JavaScript-rendered content. This package is designed to handle difficult RSS feeds that are hard to subscribe to successfully (like FitGirl Repacks at https://fitgirl-repacks.site/feed/), extracting titles, links, content, and metadata from RSS items.

Package Metadata

Name: @xmer/rss-reader
Version: 1.0.0
Description: Generic RSS feed reader with Puppeteer scraping support for JavaScript-rendered content
License: MIT
Main Entry: dist/index.js
Types: dist/index.d.ts

Core Requirements
1. RSS Feed Fetching with Puppeteer

Use Puppeteer to fetch RSS feed (handles JavaScript-rendered content)
Support for headless and headful modes (debugging)
Configurable user agent and viewport
Timeout handling for slow page loads
Retry logic for transient failures

2. RSS Item Parsing

Parse XML RSS feed structure
Extract item title from <title> tags
Extract item URL from <link> tags
Extract publication date from <pubDate> tags
Parse HTML content from <description> or <content:encoded> tags
Extract links (including magnet links) from HTML content

3. Item Data Extraction

Title Extraction: Clean item title (configurable suffix removal)
Item ID: Extract post/item ID from URL (e.g., ?p=12345)
Links: Extract all links from content (HTTP, HTTPS, magnet, etc.)
Publication Date: Parse and convert to JavaScript Date
Content: Preserve raw HTML content for additional parsing
Metadata: Extract any custom fields from RSS items

4. Browser Pool Management

Maintain pool of Puppeteer browser instances
Reuse browsers across multiple requests
Configurable pool size (default: 2)
Graceful shutdown with cleanup
Handle browser crashes and restarts

5. Validation & Normalization

Validate required fields (title, link, content)
Normalize titles (trim, remove extra whitespace)
Validate link formats (optional validators)
Deduplicate items within same feed fetch

6. Error Handling
Custom error types:

FeedFetchError: RSS feed fetch failures
ParseError: XML/HTML parsing failures
BrowserError: Puppeteer browser failures
LinkNotFoundError: Missing expected link in content
InvalidFeedError: Malformed RSS structure

Public API Surface
typescript// Main Parser Class
export class RssReader {
  constructor(config?: RssReaderConfig);

  // Lifecycle Management
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Feed Operations
  fetchFeed(feedUrl?: string): Promise<RssFeed>;
  parseItem(rawItem: RawRssItem): Promise<RssItem>;
  fetchAndParse(feedUrl?: string): Promise<RssItem[]>;

  // Utilities
  static extractLinks(html: string, pattern?: RegExp): string[];
  static extractItemId(url: string, pattern?: RegExp): string | null;
  static cleanTitle(title: string, options?: TitleCleanOptions): string;
  static validateLink(link: string, pattern?: RegExp): boolean;
}

// Configuration Interface
export interface RssReaderConfig {
  feedUrl?: string;                    // Optional: Default RSS feed URL
  userAgent?: string;                  // Optional: Custom user agent
  timeout?: number;                    // Optional: Page load timeout in ms (default: 30000)
  headless?: boolean;                  // Optional: Headless mode (default: true)
  browserPoolSize?: number;            // Optional: Browser pool size (default: 2)
  retryAttempts?: number;              // Optional: Retry attempts (default: 3)
  retryDelay?: number;                 // Optional: Delay between retries in ms (default: 1000)
  titleSuffixPattern?: RegExp;         // Optional: Pattern to remove from titles
  itemIdPattern?: RegExp;              // Optional: Pattern to extract item ID from URL
}

// Title Clean Options
export interface TitleCleanOptions {
  removeSuffix?: string | RegExp;      // Pattern to remove from title
  removePrefix?: string | RegExp;      // Pattern to remove from start
  normalizeWhitespace?: boolean;       // Remove extra whitespace (default: true)
}

// RSS Item (Parsed Item)
export interface RssItem {
  title: string;                       // Cleaned item title
  itemId?: string;                     // Post/Item ID from URL (if extractable)
  link: string;                        // Full item URL
  links: string[];                     // All links found in content
  publishedAt: Date;                   // Publication date
  rawContent?: string;                 // Original HTML content (optional)
  metadata?: Record<string, any>;      // Additional custom fields
}

// RSS Feed (Collection)
export interface RssFeed {
  items: RssItem[];                    // Parsed items
  fetchedAt: Date;                     // When feed was fetched
  feedUrl: string;                     // RSS feed URL
  totalItems: number;                  // Total items in feed
  feedTitle?: string;                  // Feed title (if available)
  feedDescription?: string;            // Feed description (if available)
}

// Raw RSS Item (Before Parsing)
export interface RawRssItem {
  title: string;                       // Raw title from RSS
  link: string;                        // Item URL
  pubDate: string;                     // Publication date string
  contentEncoded?: string;             // content:encoded field
  description?: string;                // description field
  guid?: string;                       // GUID field
  [key: string]: any;                  // Support custom fields
}
Error Types
typescriptexport class RssReaderError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RssReaderError';
  }
}

export class FeedFetchError extends RssReaderError {
  constructor(message: string, public feedUrl: string) {
    super(message, 'FEED_FETCH_FAILED');
    this.name = 'FeedFetchError';
  }
}

export class ParseError extends RssReaderError {
  constructor(message: string, public itemTitle?: string) {
    super(message, 'PARSE_FAILED');
    this.name = 'ParseError';
  }
}

export class BrowserError extends RssReaderError {
  constructor(message: string) {
    super(message, 'BROWSER_ERROR');
    this.name = 'BrowserError';
  }
}

export class LinkNotFoundError extends RssReaderError {
  constructor(itemTitle: string, linkType: string = 'link') {
    super(`${linkType} not found in: ${itemTitle}`, 'LINK_NOT_FOUND');
    this.name = 'LinkNotFoundError';
  }
}

export class InvalidFeedError extends RssReaderError {
  constructor(message: string) {
    super(message, 'INVALID_FEED');
    this.name = 'InvalidFeedError';
  }
}
```

## Project Structure
```
rss-reader/
├── src/
│   ├── reader/
│   │   └── RssReader.ts             # Main reader class
│   ├── services/
│   │   ├── FeedFetcher.ts           # Fetch RSS with Puppeteer
│   │   ├── ItemParser.ts            # Parse individual RSS items
│   │   ├── LinkExtractor.ts         # Extract links from HTML content
│   │   └── TitleCleaner.ts          # Clean and normalize titles
│   ├── browser/
│   │   ├── BrowserPool.ts           # Manage Puppeteer instances
│   │   └── BrowserManager.ts        # Single browser lifecycle
│   ├── validators/
│   │   ├── ItemValidator.ts         # Validate parsed items
│   │   └── LinkValidator.ts         # Validate link formats
│   ├── utils/
│   │   ├── UrlParser.ts             # Extract item ID from URL
│   │   ├── DateParser.ts            # Parse RSS date formats
│   │   └── RetryHandler.ts          # Retry logic with backoff
│   ├── errors/
│   │   └── RssReaderErrors.ts       # Custom error classes
│   ├── types/
│   │   ├── RssItem.ts
│   │   ├── RssFeed.ts
│   │   ├── RawRssItem.ts
│   │   ├── RssReaderConfig.ts
│   │   └── index.ts
│   └── index.ts                     # Public API exports
├── tests/
│   ├── unit/
│   │   ├── LinkExtractor.test.ts
│   │   ├── TitleCleaner.test.ts
│   │   ├── UrlParser.test.ts
│   │   └── ItemValidator.test.ts
│   ├── integration/
│   │   ├── RssReader.test.ts
│   │   └── BrowserPool.test.ts
│   └── fixtures/
│       ├── sampleFeed.xml           # Sample generic RSS feed
│       ├── fitgirlFeed.xml          # Sample FitGirl RSS feed
│       └── sampleItem.html          # Sample post content
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
Dependencies
Production Dependencies
json{
  "puppeteer": "^21.6.1",            // Headless browser
  "xml2js": "^0.6.2",                // XML parser
  "cheerio": "^1.0.0-rc.12",         // HTML parser
  "node-fetch": "^3.3.2"             // Fallback HTTP client
}
Development Dependencies
json{
  "typescript": "^5.3.0",
  "@types/node": "^20.10.0",
  "@types/xml2js": "^0.4.14",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "eslint": "^8.55.0",
  "@typescript-eslint/eslint-plugin": "^6.15.0",
  "@typescript-eslint/parser": "^6.15.0"
}
Testing Requirements
Unit Tests (80%+ Coverage)

LinkExtractor: Test link extraction from various HTML structures
TitleCleaner: Test title normalization (remove suffix/prefix, trim whitespace)
UrlParser: Test item ID extraction from different URL formats
ItemValidator: Test validation logic for all required fields
DateParser: Test RSS date format parsing

Integration Tests

RssReader.fetchAndParse(): Fetch real RSS feeds and parse (generic and FitGirl)
BrowserPool: Test browser creation, reuse, and cleanup
End-to-end: Fetch → Parse → Validate complete workflow
Error handling: Network failures, malformed feeds, missing links

Fixtures
Create sample data:

sampleFeed.xml: Generic RSS feed with 5-10 items
fitgirlFeed.xml: FitGirl RSS feed sample with magnet links
sampleItem.html: HTML content with various link types
malformedFeed.xml: Invalid RSS structure
noLinksItem.html: Content without any links

Puppeteer Browser Pool
typescriptclass BrowserPool {
  private browsers: Browser[] = [];
  private available: Browser[] = [];
  private readonly poolSize: number;
  
  async initialize(size: number): Promise<void> {
    for (let i = 0; i < size; i++) {
      const browser = await puppeteer.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.browsers.push(browser);
      this.available.push(browser);
    }
  }
  
  async acquire(): Promise<Browser> {
    // Wait for available browser
    while (this.available.length === 0) {
      await sleep(100);
    }
    return this.available.pop()!;
  }
  
  release(browser: Browser): void {
    this.available.push(browser);
  }
  
  async close(): Promise<void> {
    for (const browser of this.browsers) {
      await browser.close();
    }
    this.browsers = [];
    this.available = [];
  }
}
Feed Fetching with Puppeteer
typescriptclass FeedFetcher {
  async fetchFeed(url: string): Promise<string> {
    const browser = await this.browserPool.acquire();
    
    try {
      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(this.userAgent);
      
      // Navigate to RSS feed
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });
      
      // Get page content (RSS XML)
      const content = await page.content();
      
      return content;
    } finally {
      this.browserPool.release(browser);
    }
  }
}
XML Parsing
typescriptimport xml2js from 'xml2js';

class XmlParser {
  async parseXml(xml: string): Promise<any> {
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });
    
    return await parser.parseStringPromise(xml);
  }
}
Link Extraction
typescriptimport * as cheerio from 'cheerio';

class LinkExtractor {
  static extractLinks(html: string, pattern?: RegExp): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];

    // Find all anchor tags
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        // Filter by pattern if provided
        if (!pattern || pattern.test(href)) {
          links.push(href);
        }
      }
    });

    return links;
  }

  // Convenience method for magnet links
  static extractMagnetLinks(html: string): string[] {
    return this.extractLinks(html, /^magnet:/);
  }
}
Title Cleaning
typescriptclass TitleCleaner {
  static cleanTitle(rawTitle: string, options?: TitleCleanOptions): string {
    let cleaned = rawTitle;

    // Remove suffix if specified
    if (options?.removeSuffix) {
      const pattern = typeof options.removeSuffix === 'string'
        ? new RegExp(options.removeSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i')
        : options.removeSuffix;
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove prefix if specified
    if (options?.removePrefix) {
      const pattern = typeof options.removePrefix === 'string'
        ? new RegExp('^\\s*' + options.removePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        : options.removePrefix;
      cleaned = cleaned.replace(pattern, '');
    }

    // Normalize whitespace (default: true)
    if (options?.normalizeWhitespace !== false) {
      cleaned = cleaned.trim().replace(/\s+/g, ' ');
    }

    return cleaned;
  }
}

// Examples:
// cleanTitle("Cyberpunk 2077 – FitGirl Repacks", { removeSuffix: /[–-]\s*FitGirl Repacks/ })
//   → "Cyberpunk 2077"
// cleanTitle("Game Title  (v1.2)", { normalizeWhitespace: true })
//   → "Game Title (v1.2)"
Item ID Extraction
typescriptclass UrlParser {
  static extractItemId(url: string, pattern?: RegExp): string | null {
    // Default pattern for WordPress-style URLs: ?p=12345
    const defaultPattern = /[?&]p=(\d+)/;
    const regexToUse = pattern || defaultPattern;

    const match = url.match(regexToUse);

    if (!match || !match[1]) return null;

    return match[1];
  }
}

// Examples:
// extractItemId("https://example.com/?p=12345") → "12345"
// extractItemId("https://example.com/post/abc-123", /post\/([^/]+)/) → "abc-123"
RSS Date Parsing
typescriptclass DateParser {
  static parseRssDate(dateString: string): Date {
    // RSS date format: "Mon, 01 Jan 2024 12:00:00 +0000"
    return new Date(dateString);
  }
}
Item Validation
typescriptclass ItemValidator {
  static validate(item: Partial<RssItem>): void {
    if (!item.title || item.title.trim().length === 0) {
      throw new ParseError('Title is required');
    }

    if (!item.link || !item.link.startsWith('http')) {
      throw new ParseError('Valid item URL is required');
    }

    if (!item.publishedAt || !(item.publishedAt instanceof Date)) {
      throw new ParseError('Valid publication date is required');
    }

    if (!item.links || item.links.length === 0) {
      throw new LinkNotFoundError(item.title || 'Unknown', 'any link');
    }
  }
}
Usage Examples
Basic Usage
typescriptimport { RssReader } from '@xmer/rss-reader';

const reader = new RssReader();

// Initialize browser pool
await reader.initialize();

// Fetch and parse feed
const feed = await reader.fetchAndParse('https://example.com/feed/');

console.log(`Found ${feed.items.length} items`);

for (const item of feed.items) {
  console.log(item.title);
  console.log('URL:', item.link);
  console.log('Links found:', item.links);
  console.log('Published:', item.publishedAt);
  console.log('---');
}

// Cleanup
await reader.close();
FitGirl Feed with Custom Configuration
typescriptimport { RssReader } from '@xmer/rss-reader';

const reader = new RssReader({
  feedUrl: 'https://fitgirl-repacks.site/feed/',
  userAgent: 'MyBot/1.0',
  timeout: 60000,
  headless: false,  // Show browser for debugging
  browserPoolSize: 3,
  retryAttempts: 5,
  titleSuffixPattern: /[–-]\s*FitGirl Repacks/,  // Remove FitGirl suffix
  itemIdPattern: /[?&]p=(\d+)/  // Extract WordPress post ID
});

await reader.initialize();

const feed = await reader.fetchAndParse();

for (const item of feed.items) {
  console.log('Game:', item.title);  // Title cleaned of "– FitGirl Repacks"
  console.log('Post ID:', item.itemId);  // Extracted from URL

  // Find magnet links
  const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
  if (magnetLinks.length > 0) {
    console.log('Magnet:', magnetLinks[0]);
  }
}

await reader.close();
Parse Single Item
typescriptconst rawItem: RawRssItem = {
  title: 'Article Title',
  link: 'https://example.com/?p=12345',
  pubDate: 'Mon, 01 Jan 2024 12:00:00 +0000',
  contentEncoded: '<p><a href="https://example.com/download">Download</a></p>'
};

const item = await reader.parseItem(rawItem);
console.log(item.title);
console.log(item.links);  // All links from content
Extract Links (Utility)
typescriptimport { RssReader } from '@xmer/rss-reader';

const html = '<div><a href="magnet:?xt=urn:btih:ABC123...">Magnet</a><a href="https://example.com">Web</a></div>';

// All links
const allLinks = RssReader.extractLinks(html);
console.log(allLinks);  // ["magnet:?xt=urn:btih:ABC123...", "https://example.com"]

// Only magnet links
const magnetLinks = RssReader.extractLinks(html, /^magnet:/);
console.log(magnetLinks);  // ["magnet:?xt=urn:btih:ABC123..."]
Error Handling
typescripttry {
  const feed = await reader.fetchAndParse();
} catch (error) {
  if (error instanceof FeedFetchError) {
    console.log('Failed to fetch RSS feed:', error.feedUrl);
  } else if (error instanceof LinkNotFoundError) {
    console.log('Item missing expected links:', error.message);
  } else if (error instanceof BrowserError) {
    console.log('Browser error:', error.message);
    // Maybe restart browser pool
  }
}
README Sections

Installation: npm install @xmer/rss-reader
Prerequisites: Node.js 18+ (for Puppeteer)
Quick Start: Basic usage example with generic feeds
Advanced Usage: FitGirl feed example with custom configuration
API Reference: Complete API documentation
Configuration: All config options explained
Error Handling: All error types and recovery
Browser Management: How browser pool works
Examples: Common usage patterns (generic feeds, FitGirl, custom patterns)
Testing: How to run tests
Troubleshooting: Common issues (browser launch, timeouts, JavaScript-rendered feeds)

Performance Targets

Feed fetch latency: < 5 seconds (cold start)
Parse latency: < 100ms per item
Memory footprint: < 300MB (with 2 browsers)
Browser startup: < 2 seconds
Max concurrent fetches: 2 (pool size)

Quality Checklist

 All tests passing with 80%+ coverage
 No TypeScript errors
 Puppeteer browser cleanup verified (no zombie processes)
 Link extraction tested with real feeds (generic and FitGirl)
 Title cleaning handles edge cases with configurable patterns
 Error handling for all failure modes
 README complete with examples for generic and FitGirl feeds

Future Enhancements (v2.0.0)

Plugin system for site-specific extractors
Caching layer for repeated feed fetches
Incremental parsing (only new items since last fetch)
Screenshot capture of feed item pages
Extract additional metadata from custom RSS fields
WebSocket support for real-time feed updates
Playwright support as alternative to Puppeteer
Feed discovery (auto-detect RSS feeds on websites)