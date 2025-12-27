# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-26

### Added

**Core Features**
- Initial release of @xmer/rss-reader package
- Puppeteer-based RSS feed fetching for JavaScript-rendered content
- Browser pool management with configurable pool size (default: 2 instances)
- Comprehensive link extraction from HTML content (HTTP, HTTPS, magnet links, etc.)
- Configurable title cleaning with regex patterns (suffix/prefix removal)
- WordPress-style item ID extraction from URLs with custom pattern support
- Automatic retry logic with exponential backoff for transient failures
- RSS 2.0 and Atom feed format support

**API Surface**
- `RssReader` class as main entry point with methods:
  - `initialize()` - Initialize browser pool
  - `fetchAndParse()` - Fetch and parse RSS feeds
  - `close()` - Clean up browser resources
  - `getPoolStats()` - Monitor browser pool statistics
  - `isInitialized()` - Check initialization status
- Static utility methods:
  - `extractLinks()` - Extract links from HTML content
  - `extractItemId()` - Extract IDs from URLs
  - `cleanTitle()` - Clean titles with patterns
  - `validateLink()` - Validate link formats

**Type Definitions**
- `RssReaderConfig` - Configuration options interface
- `RssFeed` - Complete feed structure with metadata
- `RssItem` - Individual item structure with extracted data
- `RawRssItem` - Raw XML parser output structure
- `TitleCleanOptions` - Title cleaning configuration
- `BrowserPoolStats` - Browser pool statistics

**Error Handling**
- Comprehensive error hierarchy extending `RssReaderError`:
  - `FeedFetchError` - Feed fetching failures
  - `InvalidFeedError` - Invalid feed structure
  - `ParseError` - Item parsing failures
  - `BrowserError` - Browser operation failures
  - `LinkNotFoundError` - Missing links in content
- Detailed error context (feedUrl, itemTitle, operation) for debugging

**Browser Management**
- Browser pool pattern with warm instance reuse
- Automatic crash recovery and browser restart
- Configurable pool size for performance tuning
- Resource cleanup to prevent zombie processes
- Sandbox disable option for Docker/CI environments

**Parsing & Extraction**
- xml2js-based RSS XML parsing
- Cheerio-based HTML link extraction
- Date parsing for RFC 822 format timestamps
- Item deduplication by link URL
- Optional raw HTML content preservation
- Metadata field for custom data storage

**Configuration Options**
- `titleSuffixPattern` - Remove site branding from titles
- `titlePrefixPattern` - Remove prefixes from titles
- `itemIdPattern` - Custom URL ID extraction patterns
- `browserPoolSize` - Pool size tuning (default: 2)
- `retryAttempts` - Retry configuration (default: 3)
- `timeout` - Feed fetch timeout (default: 30000ms)
- `linkValidationPattern` - Link format validation
- `disableSandbox` - Chrome sandbox control for containers

**Validation**
- Required field validation for parsed items
- Link format validation against patterns
- Feed structure validation for RSS/Atom
- Type-safe interfaces with TypeScript strict mode

**Performance Optimizations**
- Browser pool for <5s feed fetch latency
- Warm browser instance reuse
- Configurable timeout and retry settings
- Memory-efficient browser lifecycle management
- Sequential item parsing to maintain order

**Documentation**
- Comprehensive README with installation guide
- Quick start examples for common use cases
- FitGirl Repacks specific configuration example
- Complete API reference with TypeScript signatures
- Error handling best practices guide
- Security considerations (sandbox, XSS warnings)
- Performance tuning recommendations
- Docker and CI/CD deployment examples
- Multiple usage examples covering various scenarios

### Security

**Security Features Added**
- Configurable Chrome sandbox control with clear warnings
- Documentation of XSS risks in `rawContent` field
- Sanitization recommendations (DOMPurify, sanitize-html)
- Docker deployment best practices
- Production security checklist

**Security Warnings**
- `disableSandbox` option documented as dangerous outside containers
- `rawContent` field marked as unsanitized HTML with XSS warnings
- References to OWASP XSS Prevention and Chromium Sandboxing docs

### Dependencies

**Production Dependencies**
- `puppeteer` ^24.34.0 - Browser automation
- `cheerio` ^1.0.0-rc.12 - HTML parsing
- `xml2js` ^0.6.2 - RSS XML parsing

**Development Dependencies**
- `typescript` ^5.3.0 - TypeScript compiler
- `jest` ^29.5.0 - Testing framework
- `ts-jest` ^29.1.0 - TypeScript Jest integration
- `eslint` ^8.45.0 - Linting
- `@typescript-eslint/parser` ^6.0.0 - TypeScript ESLint
- `@typescript-eslint/eslint-plugin` ^6.0.0 - TypeScript rules

### Requirements

- Node.js 18.0.0 or higher (required for Puppeteer)
- Sufficient system resources for browser instances

---

## Release Notes

### v1.0.0 - Initial Release

This is the first stable release of @xmer/rss-reader, a TypeScript RSS feed reader specifically designed to handle JavaScript-rendered RSS feeds using Puppeteer.

**Primary Use Case**: Parsing feeds like FitGirl Repacks that require full browser execution to render content properly.

**Key Highlights**:
- Production-ready browser pool management
- Comprehensive link extraction (HTTP, magnet links)
- Site-specific title cleaning capabilities
- Full TypeScript type safety
- Extensive error handling
- Docker/CI deployment support

**Breaking Changes**: None (initial release)

**Migration Guide**: None (initial release)

**Known Issues**: None

**Future Roadmap**:
- Additional feed format support (RSS 1.0, JSON Feed)
- Caching layer for feed metadata
- Webhook support for feed change notifications
- CLI tool for quick feed testing
- Performance metrics collection

---

[1.0.0]: https://github.com/xmer/rss-reader/releases/tag/v1.0.0
