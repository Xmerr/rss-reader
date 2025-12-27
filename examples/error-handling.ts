/**
 * Comprehensive Error Handling Example
 *
 * Demonstrates:
 * - Handling all error types
 * - Browser pool recovery after crashes
 * - Individual item error handling
 * - Graceful degradation
 */

import {
  RssReader,
  FeedFetchError,
  InvalidFeedError,
  ParseError,
  BrowserError,
  LinkNotFoundError
} from '@xmer/rss-reader';

async function processFeed(url: string): Promise<void> {
  const reader = new RssReader({
    browserPoolSize: 2,
    retryAttempts: 3,
    timeout: 30000
  });

  await reader.initialize();

  try {
    console.log(`Fetching feed: ${url}\n`);

    const feed = await reader.fetchAndParse(url);

    console.log(`Successfully fetched: ${feed.title}`);
    console.log(`Total items: ${feed.items.length}\n`);

    // Process items with individual error handling
    let successCount = 0;
    let errorCount = 0;

    for (const item of feed.items) {
      try {
        // Simulate processing that might fail
        await processItem(item);
        successCount++;
        console.log(`✓ Processed: ${item.title}`);
      } catch (itemError) {
        errorCount++;
        console.error(`✗ Failed to process: ${item.title}`);
        console.error(`  Reason: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
        // Continue processing other items
      }
    }

    console.log(`\nResults: ${successCount} successful, ${errorCount} failed`);

  } catch (error) {
    // Handle specific error types
    if (error instanceof FeedFetchError) {
      console.error('\n[FETCH ERROR]');
      console.error(`Failed to fetch feed: ${error.feedUrl}`);
      console.error(`Reason: ${error.message}`);
      console.error('Suggestion: Check network connection or increase timeout\n');

      // Could implement exponential backoff retry
      if (error.cause) {
        console.error('Original error:', error.cause);
      }

    } else if (error instanceof InvalidFeedError) {
      console.error('\n[INVALID FEED]');
      console.error(`Feed has invalid structure: ${error.feedUrl}`);
      console.error(`Reason: ${error.message}`);
      console.error('Suggestion: Verify feed URL or check if feed format changed\n');

    } else if (error instanceof BrowserError) {
      console.error('\n[BROWSER ERROR]');
      console.error(`Browser operation failed: ${error.operation}`);
      console.error(`Reason: ${error.message}`);
      console.error('Attempting to recover...\n');

      // Attempt recovery by reinitializing browser pool
      try {
        await reader.close();
        await reader.initialize();
        console.log('Browser pool recovered successfully');

        // Retry the operation
        const feed = await reader.fetchAndParse(url);
        console.log(`Recovery successful: fetched ${feed.items.length} items`);
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }

    } else if (error instanceof ParseError) {
      console.error('\n[PARSE ERROR]');
      console.error(`Failed to parse item: ${error.itemTitle || 'Unknown'}`);
      console.error(`Feed: ${error.feedUrl || 'Unknown'}`);
      console.error(`Reason: ${error.message}`);
      console.error('Suggestion: Feed may have malformed items\n');

    } else if (error instanceof LinkNotFoundError) {
      console.error('\n[LINK NOT FOUND]');
      console.error(`No links found in item: ${error.itemTitle}`);
      console.error('Suggestion: This may be expected for some feeds\n');

    } else {
      console.error('\n[UNEXPECTED ERROR]');
      console.error('An unexpected error occurred:', error);
      throw error;
    }
  } finally {
    await reader.close();
  }
}

async function processItem(item: any): Promise<void> {
  // Simulate item processing that might fail
  if (item.links.length === 0) {
    throw new Error('No links available');
  }

  // Validate links
  for (const link of item.links) {
    if (!isValidUrl(link)) {
      throw new Error(`Invalid link format: ${link}`);
    }
  }

  // Additional processing...
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return url.startsWith('magnet:'); // Magnet links are valid too
  }
}

// Example: Process multiple feeds with error handling
async function main() {
  const feeds = [
    'https://blog.example.com/feed.xml',
    'https://invalid-url.com/feed.xml', // Will fail
    'https://another-blog.com/rss'
  ];

  for (const feedUrl of feeds) {
    try {
      await processFeed(feedUrl);
    } catch (error) {
      console.error(`Failed to process feed ${feedUrl}:`, error);
    }
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
