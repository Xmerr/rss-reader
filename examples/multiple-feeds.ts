/**
 * Multiple Feeds Processing Example
 *
 * Demonstrates:
 * - Concurrent feed processing with browser pool
 * - Promise.allSettled for independent feeds
 * - Pool utilization monitoring
 * - Performance tracking
 */

import { RssReader, type RssFeed } from '@xmer/rss-reader';

interface FeedResult {
  url: string;
  success: boolean;
  feed?: RssFeed;
  error?: Error;
  duration: number;
}

async function processFeedWithTiming(
  reader: RssReader,
  url: string
): Promise<FeedResult> {
  const start = Date.now();

  try {
    const feed = await reader.fetchAndParse(url);
    const duration = Date.now() - start;

    return {
      url,
      success: true,
      feed,
      duration
    };
  } catch (error) {
    const duration = Date.now() - start;

    return {
      url,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      duration
    };
  }
}

async function main() {
  // Configure reader with larger pool for concurrent processing
  const reader = new RssReader({
    browserPoolSize: 5, // Support up to 5 concurrent feeds
    retryAttempts: 3,
    timeout: 45000
  });

  await reader.initialize();

  try {
    const feedUrls = [
      'https://blog1.example.com/feed.xml',
      'https://blog2.example.com/rss',
      'https://news.example.com/feed',
      'https://tech.example.com/feed.xml',
      'https://gaming.example.com/rss'
    ];

    console.log(`Processing ${feedUrls.length} feeds concurrently...\n`);
    console.log(`Browser pool size: ${reader.getPoolStats().total}\n`);

    const startTime = Date.now();

    // Process all feeds concurrently
    const results = await Promise.all(
      feedUrls.map(url => processFeedWithTiming(reader, url))
    );

    const totalDuration = Date.now() - startTime;

    // Analyze results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log(`Total feeds: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Total time: ${totalDuration}ms`);
    console.log(`Average per feed: ${Math.round(totalDuration / results.length)}ms\n`);

    // Display successful feeds
    if (successful.length > 0) {
      console.log('SUCCESSFUL FEEDS:\n');

      for (const result of successful) {
        console.log(`✓ ${result.feed!.title}`);
        console.log(`  URL: ${result.url}`);
        console.log(`  Items: ${result.feed!.items.length}`);
        console.log(`  Duration: ${result.duration}ms`);
        console.log(`  Avg per item: ${Math.round(result.duration / result.feed!.items.length)}ms\n`);
      }
    }

    // Display failed feeds
    if (failed.length > 0) {
      console.log('FAILED FEEDS:\n');

      for (const result of failed) {
        console.log(`✗ ${result.url}`);
        console.log(`  Error: ${result.error!.message}`);
        console.log(`  Duration: ${result.duration}ms\n`);
      }
    }

    // Display browser pool statistics
    const stats = reader.getPoolStats();
    console.log('BROWSER POOL STATS:\n');
    console.log(`  Total browsers: ${stats.total}`);
    console.log(`  In use: ${stats.inUse}`);
    console.log(`  Available: ${stats.available}`);
    console.log(`  Utilization: ${((stats.total - stats.available) / stats.total * 100).toFixed(1)}%`);

    // Calculate total items across all feeds
    const totalItems = successful.reduce((sum, r) => sum + r.feed!.items.length, 0);
    console.log(`\nTotal items fetched: ${totalItems}`);
    console.log(`Items per second: ${(totalItems / (totalDuration / 1000)).toFixed(2)}`);

  } finally {
    await reader.close();
  }
}

// Alternative: Process feeds with Promise.allSettled for independent failures
async function processIndependentFeeds() {
  const reader = new RssReader({
    browserPoolSize: 5,
    retryAttempts: 2,
    timeout: 30000
  });

  await reader.initialize();

  try {
    const feedUrls = [
      'https://reliable-feed.com/rss',
      'https://might-fail.com/feed', // This might fail
      'https://another-feed.com/rss'
    ];

    console.log('Processing feeds independently (failures won\'t stop others)...\n');

    // Use allSettled to handle independent failures
    const results = await Promise.allSettled(
      feedUrls.map(url => reader.fetchAndParse(url))
    );

    results.forEach((result, index) => {
      const url = feedUrls[index];

      if (result.status === 'fulfilled') {
        const feed = result.value;
        console.log(`✓ ${feed.title}: ${feed.items.length} items`);
      } else {
        console.error(`✗ ${url}: ${result.reason.message}`);
      }
    });

  } finally {
    await reader.close();
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
