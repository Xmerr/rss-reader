# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@xmer/rss-reader`, a standalone npm package that provides a generic TypeScript RSS feed reader with Puppeteer-based scraping for JavaScript-rendered content. The package is designed to handle difficult RSS feeds (like FitGirl Repacks) by using headless browser automation to fetch feeds and extract titles, links, content, and metadata.

## Architecture

### Core Components

**RssReader** (`src/reader/RssReader.ts`): Main entry point class that orchestrates the entire feed fetching and parsing workflow. Manages browser pool lifecycle and provides public API methods.

**Browser Pool Management** (`src/browser/`):
- `BrowserPool.ts`: Maintains a pool of Puppeteer browser instances (default: 2) for reuse across requests
- `BrowserManager.ts`: Handles single browser lifecycle (launch, crash recovery)
- Pool uses acquire/release pattern to prevent browser exhaustion

**Services** (`src/services/`):
- `FeedFetcher.ts`: Uses Puppeteer to navigate to RSS URLs and extract rendered XML content
- `ItemParser.ts`: Parses individual RSS items from XML structure into RssItem objects
- `LinkExtractor.ts`: Uses Cheerio to parse HTML content and extract all links (HTTP, magnet, etc.)
- `TitleCleaner.ts`: Normalizes titles by removing configurable suffixes/prefixes and whitespace

**Utilities** (`src/utils/`):
- `UrlParser.ts`: Extracts item IDs from URLs using regex patterns (default: WordPress-style `?p=12345`)
- `DateParser.ts`: Converts RSS date strings to JavaScript Date objects
- `RetryHandler.ts`: Implements retry logic with exponential backoff for transient failures

**Validation** (`src/validators/`):
- `ItemValidator.ts`: Validates that parsed items have required fields (title, link, publishedAt, links array)
- `LinkValidator.ts`: Validates link formats against optional regex patterns

**Error Hierarchy** (`src/errors/RssReaderErrors.ts`):
- Base: `RssReaderError`
- Derived: `FeedFetchError`, `ParseError`, `BrowserError`, `LinkNotFoundError`, `InvalidFeedError`
- Each error includes specific context (feedUrl, itemTitle, etc.) for debugging

### Data Flow

1. `RssReader.fetchAndParse(feedUrl)` → `FeedFetcher.fetchFeed()` → Acquires browser from pool
2. Puppeteer navigates to feed URL with `waitUntil: 'networkidle2'` → Returns XML string
3. XML parsed with xml2js → Extracts raw RSS items
4. Each raw item → `ItemParser.parseItem()` → Extracts fields, cleans title, parses date
5. `LinkExtractor.extractLinks()` → Cheerio parses HTML content → Returns all links
6. `ItemValidator.validate()` → Ensures required fields present → Returns `RssItem`
7. Browser released back to pool for reuse

### Key Technical Decisions

**Why Puppeteer?**: JavaScript-rendered RSS feeds (like FitGirl Repacks) require full browser execution. Static HTTP clients fail.

**Browser Pool Pattern**: Launching browsers is expensive (~2s). Pool maintains warm instances for <5s feed fetch latency.

**xml2js + Cheerio**: xml2js parses RSS XML structure, Cheerio parses HTML within `<description>` or `<content:encoded>` tags. Two-stage parsing required.

**Configuration-Driven Extraction**: Title cleaning and item ID extraction use configurable regex patterns for site-specific adaptations without code changes.

## Development Commands

**Build the package**:
```bash
npm run build
```

**Run tests**:
```bash
npm test                    # All tests
npm test -- LinkExtractor   # Specific test file
npm test -- --coverage      # With coverage report
```

**Lint code**:
```bash
npm run lint
npm run lint:fix
```

**Type checking**:
```bash
npx tsc --noEmit
```

## Testing Strategy

**Unit Tests** (`tests/unit/`): Test individual utility classes in isolation
- `LinkExtractor.test.ts`: Various HTML structures, edge cases (no links, malformed HTML)
- `TitleCleaner.test.ts`: Suffix/prefix removal, whitespace normalization, regex patterns
- `UrlParser.test.ts`: Different URL formats, custom patterns, no match cases
- `ItemValidator.test.ts`: Missing fields, invalid dates, empty links array
- Target: 80%+ coverage on utilities

**Integration Tests** (`tests/integration/`): Test component interactions
- `RssReader.test.ts`: Full fetch → parse → validate workflow using fixtures
- `BrowserPool.test.ts`: Browser creation, concurrent acquisition, cleanup, crash recovery
- Use fixtures from `tests/fixtures/` for deterministic testing

**Fixtures** (`tests/fixtures/`):
- `sampleFeed.xml`: Generic RSS 2.0 feed with 5-10 items
- `fitgirlFeed.xml`: FitGirl Repacks feed sample with magnet links in content
- `sampleItem.html`: HTML content with diverse link types
- `malformedFeed.xml`: Invalid RSS structure for error handling tests
- `noLinksItem.html`: Content without links to trigger LinkNotFoundError

## Dependencies

**Production**: Puppeteer (browser automation), xml2js (RSS XML parsing), Cheerio (HTML link extraction), node-fetch (fallback)

**Development**: TypeScript 5.3+, Jest + ts-jest (testing), ESLint + @typescript-eslint (linting)

**Critical**: Node.js 18+ required (Puppeteer dependency)

## Common Patterns

**Browser Pool Lifecycle**:
```typescript
await reader.initialize();  // Launch pool before use
try {
  await reader.fetchAndParse(url);
} finally {
  await reader.close();  // CRITICAL: Always cleanup to avoid zombie browsers
}
```

**Custom Configuration for Site-Specific Extraction**:
```typescript
const reader = new RssReader({
  titleSuffixPattern: /[–-]\s*FitGirl Repacks/,  // Remove site branding
  itemIdPattern: /[?&]p=(\d+)/,                  // WordPress-style IDs
  browserPoolSize: 3,                            // Increase for high concurrency
  retryAttempts: 5,                              // More retries for flaky sites
  timeout: 60000                                 // 60s for slow-loading feeds
});
```

**Error Handling Best Practices**:
```typescript
try {
  const feed = await reader.fetchAndParse();
} catch (error) {
  if (error instanceof FeedFetchError) {
    // Network/Puppeteer failure - retry or alert
  } else if (error instanceof LinkNotFoundError) {
    // Expected for some items - log and continue
  } else if (error instanceof BrowserError) {
    // Browser crashed - reinitialize pool
    await reader.close();
    await reader.initialize();
  }
}
```

## Performance Targets

- Feed fetch: <5s (cold start with warm pool)
- Parse per item: <100ms
- Memory: <300MB with 2 browser pool
- Browser startup: <2s
- Max concurrent: Limited by `browserPoolSize` (default: 2)

## Critical Implementation Notes

**Browser Cleanup**: Failing to call `reader.close()` leaves zombie Chromium processes. Always use try/finally or process exit handlers.

**Deduplication**: Items should be deduplicated within a single feed fetch based on `link` or `itemId` to prevent duplicates from malformed feeds.

**Link Extraction**: Must extract ALL links from HTML content, not just the first. Some items have multiple download mirrors or magnet links.

**Title Cleaning**: Default behavior should preserve original title. Only apply suffix/prefix removal when explicitly configured.

**Date Parsing**: RSS dates follow RFC 822 format (`Mon, 01 Jan 2024 12:00:00 +0000`). JavaScript `new Date()` handles this natively.

**Validation Strictness**: Missing required fields should throw errors. Missing optional fields (`itemId`, `rawContent`, `metadata`) should be undefined, not cause failures.

## Public API Surface

Exports from `src/index.ts`:
- `RssReader` class (main API)
- All type interfaces (`RssItem`, `RssFeed`, `RawRssItem`, `RssReaderConfig`, `TitleCleanOptions`)
- All error classes (`RssReaderError`, `FeedFetchError`, `ParseError`, `BrowserError`, `LinkNotFoundError`, `InvalidFeedError`)
- Static utility methods on `RssReader`: `extractLinks()`, `extractItemId()`, `cleanTitle()`, `validateLink()`

## Package Configuration

- **Main entry**: `dist/index.js` (CommonJS)
- **Types**: `dist/index.d.ts`
- **License**: MIT
- **Scope**: `@xmer` (scoped package)
- **Version**: 1.0.0 (initial release)
