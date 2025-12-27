/**
 * Basic usage example for @xmer/rss-reader
 * This example demonstrates how to use the RSS reader to fetch and parse a feed
 */

import { RssReader } from '../src/index';

async function main() {
  // Create a new RSS reader with configuration for FitGirl Repacks feed
  const reader = new RssReader({
    // Remove site branding from titles
    titleSuffixPattern: /[-\u2013]\s*FitGirl Repacks/i,
    // Browser pool size (number of concurrent browsers)
    browserPoolSize: 2,
    // Retry attempts for transient failures
    retryAttempts: 3,
    // Timeout for feed fetching (30 seconds)
    timeout: 30000,
  });

  try {
    // Initialize the browser pool
    console.log('Initializing browser pool...');
    await reader.initialize();
    console.log('Browser pool initialized');

    // Fetch and parse the feed
    // NOTE: Replace with an actual RSS feed URL for testing
    const feedUrl = 'https://example.com/feed.xml';
    console.log(`\nFetching feed: ${feedUrl}`);

    const feed = await reader.fetchAndParse(feedUrl);

    // Display feed information
    console.log(`\n=== Feed Information ===`);
    console.log(`Title: ${feed.title}`);
    console.log(`URL: ${feed.feedUrl}`);
    console.log(`Description: ${feed.description || 'N/A'}`);
    console.log(`Fetched at: ${feed.fetchedAt.toISOString()}`);
    console.log(`Total items: ${feed.items.length}`);

    // Display first 5 items
    console.log(`\n=== First 5 Items ===`);
    feed.items.slice(0, 5).forEach((item, index) => {
      console.log(`\n[${index + 1}] ${item.title}`);
      console.log(`    Link: ${item.link}`);
      console.log(`    Published: ${item.publishedAt.toISOString()}`);
      console.log(`    Item ID: ${item.itemId || 'N/A'}`);
      console.log(`    Links found: ${item.links.length}`);

      if (item.links.length > 0) {
        console.log(`    First link: ${item.links[0]}`);
      }
    });

    // Get pool statistics
    const stats = reader.getPoolStats();
    console.log(`\n=== Browser Pool Stats ===`);
    console.log(`Total browsers: ${stats.total}`);
    console.log(`Available: ${stats.available}`);
    console.log(`In use: ${stats.inUse}`);

  } catch (error) {
    console.error('Error fetching feed:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
  } finally {
    // CRITICAL: Always cleanup to avoid zombie browser processes
    console.log('\nClosing browser pool...');
    await reader.close();
    console.log('Browser pool closed');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
