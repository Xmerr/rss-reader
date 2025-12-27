/**
 * Custom Configuration Example
 *
 * Demonstrates:
 * - Title cleaning with custom patterns
 * - Custom item ID extraction
 * - Link validation patterns
 * - Performance tuning
 */

import { RssReader } from '@xmer/rss-reader';

async function techBlogExample() {
  console.log('Example 1: Tech Blog with Prefix/Suffix Cleaning\n');

  const reader = new RssReader({
    // Remove "[Article]" prefix from titles
    titlePrefixPattern: /^\[Article\]\s*/,

    // Remove "- TechBlog" suffix from titles
    titleSuffixPattern: /\s*-\s*TechBlog$/,

    // Extract ID from path-based URLs (e.g., /2024/01/12345/)
    itemIdPattern: /\/(\d+)\/$/,

    // Basic configuration
    browserPoolSize: 2,
    retryAttempts: 3
  });

  await reader.initialize();

  try {
    const feed = await reader.fetchAndParse('https://techblog.example.com/feed');

    for (const item of feed.items) {
      // Original: "[Article] TypeScript Tips - TechBlog"
      // Cleaned: "TypeScript Tips"
      console.log(`Title: ${item.title}`);
      console.log(`Item ID: ${item.itemId || 'N/A'}`);
      console.log('---\n');
    }
  } finally {
    await reader.close();
  }
}

async function newsAggregatorExample() {
  console.log('Example 2: News Aggregator with Link Validation\n');

  const reader = new RssReader({
    // Only accept HTTPS links
    linkValidationPattern: /^https:\/\//,

    // High-performance configuration
    browserPoolSize: 5,
    retryAttempts: 5,
    timeout: 60000
  });

  await reader.initialize();

  try {
    const feed = await reader.fetchAndParse('https://news.example.com/feed');

    console.log(`Feed: ${feed.title}`);
    console.log(`Items: ${feed.items.length}\n`);

    for (const item of feed.items) {
      // All links will be HTTPS (validated during parsing)
      console.log(`${item.title}: ${item.links.length} secure links`);
    }
  } finally {
    await reader.close();
  }
}

async function downloadSiteExample() {
  console.log('Example 3: Download Site with Magnet Links\n');

  const reader = new RssReader({
    // Clean release group tags
    titleSuffixPattern: /\s*\[.*\]$/,

    // Extract hash from magnet links as item ID
    itemIdPattern: /urn:btih:([a-fA-F0-9]+)/,

    // Optimize for slow feeds
    browserPoolSize: 3,
    retryAttempts: 5,
    timeout: 120000 // 2 minutes for very slow feeds
  });

  await reader.initialize();

  try {
    const feed = await reader.fetchAndParse('https://downloads.example.com/feed');

    for (const item of feed.items) {
      console.log(`Release: ${item.title}`);

      // Filter by link type
      const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
      const torrentFiles = item.links.filter(link => link.endsWith('.torrent'));
      const directDownloads = item.links.filter(link =>
        link.startsWith('http') && !link.endsWith('.torrent')
      );

      console.log(`  Magnet: ${magnetLinks.length}`);
      console.log(`  Torrent files: ${torrentFiles.length}`);
      console.log(`  Direct downloads: ${directDownloads.length}`);
      console.log('---\n');
    }
  } finally {
    await reader.close();
  }
}

async function dockerEnvironmentExample() {
  console.log('Example 4: Docker Environment with Sandbox Disabled\n');

  const reader = new RssReader({
    // ONLY safe in Docker containers
    disableSandbox: process.env.RUNNING_IN_DOCKER === 'true',

    browserPoolSize: 3,
    timeout: 45000
  });

  await reader.initialize();

  try {
    console.log('Running in Docker:', process.env.RUNNING_IN_DOCKER === 'true');
    console.log('Sandbox disabled:', process.env.RUNNING_IN_DOCKER === 'true');

    const feed = await reader.fetchAndParse('https://example.com/feed.xml');
    console.log(`Fetched: ${feed.title} (${feed.items.length} items)`);
  } finally {
    await reader.close();
  }
}

async function usingStaticUtilities() {
  console.log('Example 5: Using Static Utility Methods\n');

  // Extract links from HTML without creating a reader
  const html = `
    <div>
      <a href="https://example.com/page1">Link 1</a>
      <a href="https://example.com/page2">Link 2</a>
      <a href="magnet:?xt=urn:btih:abc123">Magnet</a>
    </div>
  `;

  const links = RssReader.extractLinks(html);
  console.log('Extracted links:');
  links.forEach(link => console.log(`  - ${link}`));

  // Extract item ID from URL
  const url1 = 'https://blog.com/?p=12345';
  const id1 = RssReader.extractItemId(url1);
  console.log(`\nID from ${url1}: ${id1}`);

  // Extract with custom pattern
  const url2 = 'https://blog.com/2024/01/67890/';
  const id2 = RssReader.extractItemId(url2, /\/(\d+)\/$/);
  console.log(`ID from ${url2}: ${id2}`);

  // Clean title
  const dirtyTitle = 'Amazing Article – Site Name';
  const cleanTitle = RssReader.cleanTitle(dirtyTitle, {
    suffixPattern: /[–-]\s*Site Name/
  });
  console.log(`\nOriginal: "${dirtyTitle}"`);
  console.log(`Cleaned: "${cleanTitle}"`);

  // Validate links
  const httpsLink = 'https://secure.example.com';
  const httpLink = 'http://insecure.example.com';

  const isHttpsValid = RssReader.validateLink(httpsLink, /^https:\/\//);
  const isHttpValid = RssReader.validateLink(httpLink, /^https:\/\//);

  console.log(`\n${httpsLink} is HTTPS: ${isHttpsValid}`);
  console.log(`${httpLink} is HTTPS: ${isHttpValid}`);
}

// Run all examples
async function main() {
  try {
    await techBlogExample();
    console.log('\n' + '='.repeat(80) + '\n');

    await newsAggregatorExample();
    console.log('\n' + '='.repeat(80) + '\n');

    await downloadSiteExample();
    console.log('\n' + '='.repeat(80) + '\n');

    await dockerEnvironmentExample();
    console.log('\n' + '='.repeat(80) + '\n');

    await usingStaticUtilities();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
