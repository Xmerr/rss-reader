/**
 * FitGirl Repacks Feed Example
 *
 * Demonstrates:
 * - Site-specific configuration (title cleaning, item ID extraction)
 * - Magnet link extraction
 * - High-performance settings for slow feeds
 * - Error handling for flaky connections
 */

import {
  RssReader,
  FeedFetchError,
  ParseError,
  type RssItem
} from '@xmer/rss-reader';

async function main() {
  // Configure reader for FitGirl Repacks feed
  const reader = new RssReader({
    // Remove "– FitGirl Repacks" suffix from titles
    titleSuffixPattern: /[–-]\s*FitGirl Repacks/,

    // Extract WordPress-style post IDs
    itemIdPattern: /[?&]p=(\d+)/,

    // Increase browser pool for better throughput
    browserPoolSize: 3,

    // More retries for potentially flaky connections
    retryAttempts: 5,

    // Longer timeout for slow-loading feeds
    timeout: 60000
  });

  await reader.initialize();

  try {
    console.log('Fetching FitGirl Repacks feed...\n');

    const feed = await reader.fetchAndParse('https://fitgirl-repacks.site/feed/');

    console.log(`Feed: ${feed.title}`);
    console.log(`Found ${feed.items.length} games\n`);

    // Process each game release
    for (const item of feed.items) {
      console.log(`Game: ${item.title}`); // Title is cleaned
      console.log(`Post ID: ${item.itemId || 'N/A'}`);
      console.log(`Released: ${item.publishedAt.toLocaleDateString()}`);
      console.log(`Post URL: ${item.link}`);

      // Extract different link types
      const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
      const httpLinks = item.links.filter(link =>
        link.startsWith('http://') || link.startsWith('https://')
      );

      console.log(`\nDownload Options:`);
      console.log(`  Magnet links: ${magnetLinks.length}`);
      console.log(`  HTTP mirrors: ${httpLinks.length}`);

      // Display first magnet link if available
      if (magnetLinks.length > 0) {
        console.log(`\nPrimary magnet link:`);
        console.log(`  ${magnetLinks[0].substring(0, 80)}...`);
      }

      // Display HTTP mirrors
      if (httpLinks.length > 0) {
        console.log(`\nHTTP mirrors:`);
        httpLinks.slice(0, 3).forEach(link => {
          console.log(`  - ${link}`);
        });
        if (httpLinks.length > 3) {
          console.log(`  ... and ${httpLinks.length - 3} more`);
        }
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Show browser pool statistics
    const stats = reader.getPoolStats();
    console.log(`\nBrowser pool stats:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  In use: ${stats.inUse}`);
    console.log(`  Available: ${stats.available}`);

  } catch (error) {
    if (error instanceof FeedFetchError) {
      console.error(`Failed to fetch feed: ${error.message}`);
      console.error(`Feed URL: ${error.feedUrl}`);
      // Could implement exponential backoff retry here
    } else if (error instanceof ParseError) {
      console.error(`Failed to parse item: ${error.itemTitle}`);
      console.error(`Error: ${error.message}`);
      // Some items may still be valid
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  } finally {
    await reader.close();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
