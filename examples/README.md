# @xmer/rss-reader Examples

This directory contains practical examples demonstrating various features and use cases of the @xmer/rss-reader package.

## Running Examples

Each example is a standalone TypeScript file. To run them:

1. Install dependencies:
```bash
npm install
```

2. Build the package:
```bash
npm run build
```

3. Run an example with ts-node:
```bash
npx ts-node examples/basic-usage.ts
```

Or compile and run:
```bash
npx tsc examples/basic-usage.ts
node examples/basic-usage.js
```

## Available Examples

### 1. basic-usage.ts

**What it demonstrates:**
- Creating a reader instance
- Initializing the browser pool
- Fetching and parsing a feed
- Accessing feed items and their properties
- Proper cleanup with try/finally

**Best for:** First-time users learning the basics

**Key concepts:**
- Reader initialization
- Feed parsing
- Item iteration
- Resource cleanup

### 2. fitgirl-repacks.ts

**What it demonstrates:**
- Site-specific configuration (title cleaning, item ID extraction)
- Magnet link extraction
- High-performance settings for slow feeds
- Error handling for flaky connections

**Best for:** Parsing JavaScript-rendered feeds like FitGirl Repacks

**Key concepts:**
- Custom title patterns
- Link type filtering
- Performance tuning
- Browser pool statistics

### 3. error-handling.ts

**What it demonstrates:**
- Handling all error types (FeedFetchError, BrowserError, etc.)
- Browser pool recovery after crashes
- Individual item error handling
- Graceful degradation

**Best for:** Production applications requiring robust error handling

**Key concepts:**
- Error type discrimination
- Recovery strategies
- Partial success handling
- Error logging

### 4. multiple-feeds.ts

**What it demonstrates:**
- Concurrent feed processing with browser pool
- Promise.allSettled for independent feeds
- Pool utilization monitoring
- Performance tracking

**Best for:** Applications processing multiple feeds simultaneously

**Key concepts:**
- Concurrent processing
- Performance metrics
- Pool management
- Independent failure handling

### 5. custom-configuration.ts

**What it demonstrates:**
- Title cleaning with custom patterns
- Custom item ID extraction
- Link validation patterns
- Static utility methods
- Different configuration strategies

**Best for:** Advanced users needing custom parsing logic

**Key concepts:**
- Regex pattern configuration
- Link filtering
- Static utilities
- Environment-specific settings

## Example Modifications

### Changing Feed URLs

Replace example URLs with real feed URLs:

```typescript
// Change this
const feed = await reader.fetchAndParse('https://example.com/feed.xml');

// To your actual feed
const feed = await reader.fetchAndParse('https://your-site.com/rss');
```

### Adjusting Configuration

Modify configuration based on your needs:

```typescript
const reader = new RssReader({
  browserPoolSize: 5,      // Increase for more concurrency
  retryAttempts: 5,        // More retries for unreliable feeds
  timeout: 60000,          // Longer timeout for slow feeds
  titleSuffixPattern: /your-pattern/  // Your site-specific pattern
});
```

### Adding Custom Processing

Extend examples with your own logic:

```typescript
for (const item of feed.items) {
  // Your custom processing
  await saveToDatabase(item);
  await notifySubscribers(item);
  await generateThumbnail(item);
}
```

## Common Patterns

### Pattern 1: Filter by Date

```typescript
const recentItems = feed.items.filter(item => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return item.publishedAt > oneDayAgo;
});
```

### Pattern 2: Extract Specific Links

```typescript
const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
const httpsLinks = item.links.filter(link => link.startsWith('https://'));
```

### Pattern 3: Monitor Performance

```typescript
const start = Date.now();
const feed = await reader.fetchAndParse(url);
const duration = Date.now() - start;
console.log(`Fetched in ${duration}ms (${duration / feed.items.length}ms per item)`);
```

### Pattern 4: Batch Processing

```typescript
const batchSize = 10;
for (let i = 0; i < feed.items.length; i += batchSize) {
  const batch = feed.items.slice(i, i + batchSize);
  await processBatch(batch);
}
```

## Testing Examples

Each example can be tested with mock feeds. Replace feed URLs with test fixtures:

```typescript
// Use local test fixture
const feed = await reader.fetchAndParse('file:///path/to/test-feed.xml');
```

## Troubleshooting

**Example fails with "Browser pool not initialized":**
- Ensure `await reader.initialize()` is called before `fetchAndParse()`

**Example hangs or times out:**
- Increase timeout: `timeout: 60000`
- Check network connectivity
- Verify feed URL is accessible

**Memory issues:**
- Reduce browser pool size: `browserPoolSize: 1`
- Ensure `reader.close()` is called in finally block

**Import errors:**
- Build the package first: `npm run build`
- Check import path: `import { RssReader } from '@xmer/rss-reader'`

## Further Reading

- [Main README](../README.md) - Complete package documentation
- [API Reference](../README.md#api-reference) - Detailed API documentation
- [Configuration Options](../README.md#configuration-options) - All available options
- [Error Handling](../README.md#error-handling) - Error handling guide

## Contributing Examples

Have a useful example? Contributions are welcome! Please ensure:
1. Code is well-commented
2. Example is self-contained
3. Error handling is demonstrated
4. Resource cleanup is shown (try/finally)
