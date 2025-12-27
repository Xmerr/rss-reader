# @xmer/rss-reader

A robust TypeScript RSS feed reader with Puppeteer-based scraping for JavaScript-rendered content. Designed to handle challenging RSS feeds that require full browser execution, with built-in browser pool management, link extraction, and configurable content parsing.

## Key Features

- **JavaScript-Rendered Feed Support**: Uses Puppeteer to handle feeds that require browser execution
- **Browser Pool Management**: Maintains warm browser instances for <5s feed fetch latency
- **Comprehensive Link Extraction**: Extracts all links from HTML content (HTTP, HTTPS, magnet, etc.)
- **Configurable Title Cleaning**: Remove site-specific suffixes/prefixes with regex patterns
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **TypeScript-First**: Full type safety with detailed interface definitions
- **Error Handling**: Comprehensive error hierarchy for precise error handling
- **Memory Efficient**: Configurable browser pool size to balance performance and resource usage

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [FitGirl Repacks Example](#fitgirl-repacks-example)
- [Configuration Options](#configuration-options)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Performance](#performance)
- [Docker/CI Deployment](#dockerci-deployment)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install @xmer/rss-reader
```

### Requirements

- Node.js 18.0.0 or higher
- Sufficient system resources for Puppeteer (default: 2 browser instances)

### Peer Dependencies

All dependencies are bundled with the package:
- `puppeteer` ^24.34.0
- `cheerio` ^1.0.0-rc.12
- `xml2js` ^0.6.2

## Quick Start

```typescript
import { RssReader } from '@xmer/rss-reader';

// Create reader instance
const reader = new RssReader();

// Initialize browser pool (REQUIRED)
await reader.initialize();

try {
  // Fetch and parse feed
  const feed = await reader.fetchAndParse('https://example.com/feed.xml');

  console.log(`Feed: ${feed.title}`);
  console.log(`Items: ${feed.items.length}`);

  // Access parsed items
  for (const item of feed.items) {
    console.log(`${item.title} - ${item.links.length} links`);
    console.log(`Published: ${item.publishedAt.toISOString()}`);
  }
} finally {
  // CRITICAL: Always close to prevent zombie browsers
  await reader.close();
}
```

## FitGirl Repacks Example

Primary use case: Parsing FitGirl Repacks feed with title cleaning and magnet link extraction.

```typescript
import { RssReader, type RssItem } from '@xmer/rss-reader';

const reader = new RssReader({
  // Remove site branding from titles
  titleSuffixPattern: /[–-]\s*FitGirl Repacks/,

  // Extract WordPress-style item IDs
  itemIdPattern: /[?&]p=(\d+)/,

  // Increase pool size for better throughput
  browserPoolSize: 3,

  // More retries for potentially flaky connections
  retryAttempts: 5,

  // Longer timeout for slow-loading feeds
  timeout: 60000
});

await reader.initialize();

try {
  const feed = await reader.fetchAndParse('https://fitgirl-repacks.site/feed/');

  for (const item of feed.items) {
    // Title is cleaned: "Game Name – FitGirl Repacks" -> "Game Name"
    console.log(`Game: ${item.title}`);
    console.log(`Post ID: ${item.itemId}`);

    // Extract magnet links
    const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
    console.log(`Magnet links: ${magnetLinks.length}`);

    if (magnetLinks.length > 0) {
      console.log(`Download: ${magnetLinks[0]}`);
    }
  }
} catch (error) {
  if (error instanceof FeedFetchError) {
    console.error(`Failed to fetch feed: ${error.message}`);
  } else if (error instanceof ParseError) {
    console.error(`Failed to parse item: ${error.itemTitle}`);
  }
} finally {
  await reader.close();
}
```

## Configuration Options

Configure `RssReader` behavior by passing options to the constructor:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `titleSuffixPattern` | `RegExp` | `undefined` | Pattern to remove from end of titles (e.g., `/[–-]\s*Site Name/`) |
| `titlePrefixPattern` | `RegExp` | `undefined` | Pattern to remove from start of titles |
| `itemIdPattern` | `RegExp` | `/[?&]p=(\d+)/` | Pattern to extract item ID from URLs (WordPress-style by default) |
| `browserPoolSize` | `number` | `2` | Number of browser instances in pool (balance performance vs resources) |
| `retryAttempts` | `number` | `3` | Maximum retry attempts for transient failures |
| `timeout` | `number` | `30000` | Timeout for feed fetching in milliseconds |
| `linkValidationPattern` | `RegExp` | `undefined` | Optional regex pattern to validate extracted links |
| `disableSandbox` | `boolean` | `false` | **DANGER**: Disable Chrome sandbox (only for Docker/CI) |

### Configuration Examples

**Basic configuration:**
```typescript
const reader = new RssReader({
  browserPoolSize: 3,
  timeout: 45000
});
```

**Site-specific extraction:**
```typescript
const reader = new RssReader({
  titleSuffixPattern: /\s*-\s*Blog Name$/,
  titlePrefixPattern: /^\[News\]\s*/,
  itemIdPattern: /\/(\d+)\/$/  // Extract from URL path
});
```

**High-performance setup:**
```typescript
const reader = new RssReader({
  browserPoolSize: 5,
  retryAttempts: 5,
  timeout: 60000
});
```

## API Reference

### RssReader Class

Main entry point for RSS feed reading.

#### Constructor

```typescript
new RssReader(config?: RssReaderConfig)
```

Creates a new `RssReader` instance with optional configuration.

**Parameters:**
- `config` (RssReaderConfig): Optional configuration object

**Example:**
```typescript
const reader = new RssReader({
  browserPoolSize: 2,
  retryAttempts: 3
});
```

#### initialize()

```typescript
async initialize(): Promise<void>
```

Initializes the browser pool. MUST be called before `fetchAndParse()`.

**Throws:**
- `BrowserError`: If browser pool initialization fails

**Example:**
```typescript
await reader.initialize();
```

#### fetchAndParse()

```typescript
async fetchAndParse(feedUrl: string): Promise<RssFeed>
```

Fetches and parses an RSS feed.

**Parameters:**
- `feedUrl` (string): URL of the RSS feed to fetch

**Returns:**
- `Promise<RssFeed>`: Parsed RSS feed with all items

**Throws:**
- `FeedFetchError`: If fetching fails after all retries
- `InvalidFeedError`: If feed structure is invalid
- `ParseError`: If item parsing fails
- `BrowserError`: If browser pool is not initialized

**Example:**
```typescript
const feed = await reader.fetchAndParse('https://example.com/feed.xml');
console.log(`Found ${feed.items.length} items`);
```

#### close()

```typescript
async close(): Promise<void>
```

Closes the browser pool and cleans up resources. MUST be called when done to prevent zombie browser processes.

**Example:**
```typescript
try {
  await reader.fetchAndParse(url);
} finally {
  await reader.close();
}
```

#### getPoolStats()

```typescript
getPoolStats(): BrowserPoolStats
```

Returns current browser pool statistics.

**Returns:**
- `BrowserPoolStats`: Object containing `total`, `available`, and `inUse` counts

**Example:**
```typescript
const stats = reader.getPoolStats();
console.log(`Pool: ${stats.inUse}/${stats.total} in use`);
```

#### isInitialized()

```typescript
isInitialized(): boolean
```

Checks if the reader is initialized.

**Returns:**
- `boolean`: `true` if initialized

#### Static Utilities

Utility methods for standalone use without creating a reader instance:

**extractLinks()**
```typescript
static extractLinks(html: string): string[]
```

Extracts all links from HTML content.

**Parameters:**
- `html` (string): HTML content to parse

**Returns:**
- `string[]`: Array of extracted links

**Example:**
```typescript
const links = RssReader.extractLinks('<a href="https://example.com">Link</a>');
```

**extractItemId()**
```typescript
static extractItemId(url: string, pattern?: RegExp): string | undefined
```

Extracts item ID from URL using regex pattern.

**Parameters:**
- `url` (string): URL to parse
- `pattern` (RegExp): Optional regex pattern (default: WordPress-style)

**Returns:**
- `string | undefined`: Extracted ID or undefined if not found

**Example:**
```typescript
const id = RssReader.extractItemId('https://example.com/?p=12345');
// Returns: "12345"
```

**cleanTitle()**
```typescript
static cleanTitle(title: string, options?: TitleCleanOptions): string
```

Cleans title by removing patterns and normalizing whitespace.

**Parameters:**
- `title` (string): Title to clean
- `options` (TitleCleanOptions): Optional cleaning options

**Returns:**
- `string`: Cleaned title

**Example:**
```typescript
const cleaned = RssReader.cleanTitle('Game – Site Name', {
  suffixPattern: /[–-]\s*Site Name/
});
// Returns: "Game"
```

**validateLink()**
```typescript
static validateLink(link: string, pattern?: RegExp): boolean
```

Validates link against optional pattern.

**Parameters:**
- `link` (string): Link to validate
- `pattern` (RegExp): Optional validation pattern

**Returns:**
- `boolean`: `true` if valid

### Type Interfaces

#### RssFeed

```typescript
interface RssFeed {
  title: string;              // Feed title
  feedUrl: string;            // Feed URL
  description?: string;       // Feed description
  items: RssItem[];           // Parsed items
  fetchedAt: Date;            // Fetch timestamp
}
```

#### RssItem

```typescript
interface RssItem {
  title: string;              // Item title (cleaned)
  link: string;               // Item link/URL
  publishedAt: Date;          // Publication date
  links: string[];            // All extracted links from content
  itemId?: string;            // Optional item ID extracted from URL
  rawContent?: string;        // Optional raw HTML content (UNSANITIZED)
  metadata?: Record<string, unknown>;  // Optional additional metadata
}
```

**SECURITY WARNING**: The `rawContent` field contains unsanitized HTML. See [Security Considerations](#security-considerations).

#### RssReaderConfig

See [Configuration Options](#configuration-options) table above.

#### BrowserPoolStats

```typescript
interface BrowserPoolStats {
  total: number;      // Total browsers in pool
  available: number;  // Available browsers
  inUse: number;      // Browsers currently in use
}
```

## Error Handling

All errors extend the base `RssReaderError` class for easy identification.

### Error Types

**RssReaderError**
Base error class for all package errors.

**FeedFetchError**
Thrown when feed fetching fails (network issues, timeout, Puppeteer errors).

```typescript
try {
  await reader.fetchAndParse(url);
} catch (error) {
  if (error instanceof FeedFetchError) {
    console.error(`Failed to fetch ${error.feedUrl}: ${error.message}`);
    // Retry with exponential backoff or alert
  }
}
```

**InvalidFeedError**
Thrown when feed structure is invalid or cannot be parsed as RSS/Atom.

```typescript
catch (error) {
  if (error instanceof InvalidFeedError) {
    console.error(`Invalid feed at ${error.feedUrl}`);
    // Skip this feed or alert administrator
  }
}
```

**ParseError**
Thrown when individual item parsing fails.

```typescript
catch (error) {
  if (error instanceof ParseError) {
    console.error(`Failed to parse item: ${error.itemTitle}`);
    // Log and continue with other items
  }
}
```

**BrowserError**
Thrown when browser operations fail (launch, crash, pool exhaustion).

```typescript
catch (error) {
  if (error instanceof BrowserError) {
    console.error(`Browser error during ${error.operation}`);
    // Reinitialize browser pool
    await reader.close();
    await reader.initialize();
  }
}
```

**LinkNotFoundError**
Thrown when no links are found in item content (may be expected for some feeds).

```typescript
catch (error) {
  if (error instanceof LinkNotFoundError) {
    console.warn(`No links found in: ${error.itemTitle}`);
    // Expected for some items - log and continue
  }
}
```

### Error Handling Best Practices

```typescript
import {
  RssReader,
  FeedFetchError,
  BrowserError,
  ParseError
} from '@xmer/rss-reader';

const reader = new RssReader();
await reader.initialize();

try {
  const feed = await reader.fetchAndParse(url);

  // Process items
  for (const item of feed.items) {
    try {
      await processItem(item);
    } catch (itemError) {
      // Log individual item failures but continue
      console.error(`Failed to process ${item.title}:`, itemError);
    }
  }
} catch (error) {
  if (error instanceof FeedFetchError) {
    // Network/Puppeteer failure - retry or alert
    console.error('Feed fetch failed:', error.message);
  } else if (error instanceof BrowserError) {
    // Browser crashed - reinitialize pool
    console.error('Browser error:', error.message);
    await reader.close();
    await reader.initialize();
  } else if (error instanceof ParseError) {
    // Parse failure - log and skip
    console.error('Parse error:', error.message);
  } else {
    // Unexpected error
    console.error('Unexpected error:', error);
  }
} finally {
  // ALWAYS cleanup
  await reader.close();
}
```

## Security Considerations

### CRITICAL: Chrome Sandbox

The `disableSandbox` option removes Chrome's process isolation security layer.

**NEVER set `disableSandbox: true` in production environments unless:**
- Running inside a Docker container with proper isolation
- Running in a CI/CD pipeline with ephemeral environments
- You fully understand the security implications

**Why this is dangerous:**
- Compromised websites can escape the browser and access your system
- Malicious content in RSS feeds can execute arbitrary code
- No process isolation between browser tabs

**Safe usage in Docker:**
```typescript
const reader = new RssReader({
  // Only safe inside Docker containers
  disableSandbox: process.env.RUNNING_IN_DOCKER === 'true'
});
```

**References:**
- [Chromium Sandboxing](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux/sandboxing.md)
- [Puppeteer Docker Best Practices](https://pptr.dev/troubleshooting#running-puppeteer-in-docker)

### XSS Warning: rawContent Field

The `rawContent` field in `RssItem` contains **unsanitized HTML** from the RSS feed.

**NEVER render this content directly:**
```typescript
// DANGEROUS - XSS vulnerability
element.innerHTML = item.rawContent;
```

**Always sanitize before rendering:**
```typescript
import DOMPurify from 'dompurify';

// SAFE - sanitized HTML
const clean = DOMPurify.sanitize(item.rawContent);
element.innerHTML = clean;
```

**Recommended sanitization libraries:**
- [DOMPurify](https://github.com/cure53/DOMPurify) - Client-side HTML sanitization
- [sanitize-html](https://github.com/apostrophecms/sanitize-html) - Server-side HTML sanitization

**References:**
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### Production Security Best Practices

1. **Run in isolated containers**: Use Docker with proper resource limits
2. **Sanitize all output**: Never trust content from RSS feeds
3. **Validate links**: Use `linkValidationPattern` to restrict allowed link formats
4. **Monitor resource usage**: Browser instances consume significant memory
5. **Set reasonable timeouts**: Prevent indefinite hangs on malicious feeds
6. **Log security events**: Track failed fetches and suspicious content

## Performance

### Performance Targets

- **Feed fetch**: <5s (with warm browser pool)
- **Parse per item**: <100ms
- **Memory**: ~300MB with 2 browser pool
- **Browser startup**: ~2s cold start
- **Max concurrent**: Limited by `browserPoolSize`

### Optimization Tips

**Browser Pool Sizing:**
```typescript
// Low concurrency (1-2 feeds simultaneously)
browserPoolSize: 2  // Default, ~300MB memory

// Medium concurrency (3-5 feeds simultaneously)
browserPoolSize: 5  // ~750MB memory

// High concurrency (10+ feeds simultaneously)
browserPoolSize: 10  // ~1.5GB memory
```

**Timeout Configuration:**
```typescript
// Fast, reliable feeds
timeout: 15000  // 15s

// Slow or unreliable feeds
timeout: 60000  // 60s

// Very slow feeds (use sparingly)
timeout: 120000  // 2 minutes
```

**Retry Strategy:**
```typescript
// Reliable network
retryAttempts: 2

// Unreliable network or flaky feeds
retryAttempts: 5

// Critical feeds that must succeed
retryAttempts: 10
```

### Memory Management

Monitor browser pool health:
```typescript
const stats = reader.getPoolStats();
if (stats.inUse === stats.total) {
  console.warn('Browser pool exhausted - consider increasing poolSize');
}
```

### Monitoring

```typescript
// Track fetch performance
const start = Date.now();
const feed = await reader.fetchAndParse(url);
const duration = Date.now() - start;

console.log(`Fetched ${feed.items.length} items in ${duration}ms`);
console.log(`Avg per item: ${duration / feed.items.length}ms`);

// Monitor pool utilization
const stats = reader.getPoolStats();
console.log(`Pool utilization: ${(stats.inUse / stats.total * 100).toFixed(1)}%`);
```

## Docker/CI Deployment

### Dockerfile Example

```dockerfile
FROM node:18-alpine

# Install Chromium dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome (use system Chromium)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    RUNNING_IN_DOCKER=true

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

CMD ["node", "dist/index.js"]
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  rss-reader:
    build: .
    environment:
      - NODE_ENV=production
      - RUNNING_IN_DOCKER=true
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
```

### Application Code for Docker

```typescript
import { RssReader } from '@xmer/rss-reader';

const reader = new RssReader({
  // Safe in Docker container
  disableSandbox: process.env.RUNNING_IN_DOCKER === 'true',
  browserPoolSize: 3,
  timeout: 60000
});

await reader.initialize();

try {
  const feed = await reader.fetchAndParse(url);
  // Process feed
} finally {
  await reader.close();
}
```

### CI/CD (GitHub Actions) Example

```yaml
name: RSS Reader CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            chromium-browser \
            libx11-xcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxi6 \
            libxtst6 \
            libnss3 \
            libcups2 \
            libxss1 \
            libxrandr2 \
            libasound2 \
            libatk1.0-0 \
            libatk-bridge2.0-0 \
            libpangocairo-1.0-0 \
            libgtk-3-0

      - name: Run tests
        run: npm test
        env:
          PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser
```

## Examples

### Basic Usage

```typescript
import { RssReader } from '@xmer/rss-reader';

const reader = new RssReader();
await reader.initialize();

try {
  const feed = await reader.fetchAndParse('https://blog.example.com/feed.xml');

  for (const item of feed.items) {
    console.log(item.title);
    console.log(item.publishedAt.toLocaleDateString());
    console.log(item.links.join(', '));
    console.log('---');
  }
} finally {
  await reader.close();
}
```

### Custom Title Cleaning

```typescript
const reader = new RssReader({
  titleSuffixPattern: /\s*-\s*TechBlog$/,
  titlePrefixPattern: /^\[Article\]\s*/
});

await reader.initialize();

try {
  const feed = await reader.fetchAndParse('https://techblog.example.com/feed');

  // Titles are cleaned:
  // "[Article] TypeScript Tips - TechBlog" -> "TypeScript Tips"
  for (const item of feed.items) {
    console.log(item.title);
  }
} finally {
  await reader.close();
}
```

### Extracting Specific Link Types

```typescript
const reader = new RssReader();
await reader.initialize();

try {
  const feed = await reader.fetchAndParse('https://downloads.example.com/feed');

  for (const item of feed.items) {
    // Extract only magnet links
    const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));

    // Extract only HTTP(S) links
    const httpLinks = item.links.filter(link =>
      link.startsWith('http://') || link.startsWith('https://')
    );

    console.log(`${item.title}:`);
    console.log(`  Magnet: ${magnetLinks.length}`);
    console.log(`  HTTP: ${httpLinks.length}`);
  }
} finally {
  await reader.close();
}
```

### Processing Multiple Feeds

```typescript
const reader = new RssReader({
  browserPoolSize: 5,  // Support concurrent processing
  retryAttempts: 3
});

await reader.initialize();

try {
  const feedUrls = [
    'https://feed1.example.com/rss',
    'https://feed2.example.com/rss',
    'https://feed3.example.com/rss'
  ];

  // Process feeds concurrently
  const results = await Promise.allSettled(
    feedUrls.map(url => reader.fetchAndParse(url))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const feed = result.value;
      console.log(`${feed.title}: ${feed.items.length} items`);
    } else {
      console.error(`Failed to fetch feed: ${result.reason}`);
    }
  }
} finally {
  await reader.close();
}
```

### Advanced Error Handling

```typescript
import {
  RssReader,
  FeedFetchError,
  BrowserError,
  ParseError,
  InvalidFeedError,
  LinkNotFoundError
} from '@xmer/rss-reader';

const reader = new RssReader();
await reader.initialize();

try {
  const feed = await reader.fetchAndParse(url);

  for (const item of feed.items) {
    console.log(`${item.title}: ${item.links.length} links`);
  }
} catch (error) {
  if (error instanceof FeedFetchError) {
    console.error(`Network error for ${error.feedUrl}:`, error.message);
    // Implement exponential backoff retry
  } else if (error instanceof InvalidFeedError) {
    console.error(`Invalid feed structure: ${error.feedUrl}`);
    // Alert administrator - feed may have changed format
  } else if (error instanceof BrowserError) {
    console.error(`Browser crashed during ${error.operation}`);
    // Reinitialize browser pool
    await reader.close();
    await reader.initialize();
  } else if (error instanceof ParseError) {
    console.error(`Parse error for item ${error.itemTitle}:`, error.message);
    // Log and continue - some items may still be valid
  } else if (error instanceof LinkNotFoundError) {
    console.warn(`No links in ${error.itemTitle}`);
    // Expected for some feeds - log warning
  } else {
    console.error('Unexpected error:', error);
    throw error;
  }
} finally {
  await reader.close();
}
```

### Using Static Utilities

```typescript
import { RssReader } from '@xmer/rss-reader';

// Extract links from HTML without creating a reader instance
const html = '<a href="https://example.com">Link 1</a><a href="magnet:?xt=...">Magnet</a>';
const links = RssReader.extractLinks(html);
console.log(links);  // ['https://example.com', 'magnet:?xt=...']

// Extract item ID from URL
const id = RssReader.extractItemId('https://blog.com/?p=12345');
console.log(id);  // '12345'

// Clean title
const cleaned = RssReader.cleanTitle('Game Name – Site Branding', {
  suffixPattern: /[–-]\s*Site Branding/
});
console.log(cleaned);  // 'Game Name'

// Validate link
const isValid = RssReader.validateLink('https://example.com', /^https:\/\//);
console.log(isValid);  // true
```

## Contributing

Contributions are welcome! Please see the repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.

---

**Made with** TypeScript, Puppeteer, Cheerio, and xml2js.
