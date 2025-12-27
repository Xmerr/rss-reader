import { RssReader } from './dist/index.js';

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
  const feed = await reader.fetchAndParse('https://fitgirl-repacks.site/rss/');

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
  console.error(`Failed to fetch feed: ${error.message}`);
} finally {
  await reader.close();
}