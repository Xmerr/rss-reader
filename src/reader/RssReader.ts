/**
 * Main RSS reader class that orchestrates feed fetching and parsing
 */

import { parseString } from 'xml2js';
import type { RssReaderConfig, RssFeed, RssItem, RawRssItem, TitleCleanOptions } from '../types';
import { BrowserPool } from '../browser/BrowserPool';
import { FeedFetcher } from '../services/FeedFetcher';
import { ItemParser } from '../services/ItemParser';
import { ItemValidator } from '../validators/ItemValidator';
import { LinkExtractor } from '../services/LinkExtractor';
import { TitleCleaner } from '../services/TitleCleaner';
import { UrlParser } from '../utils/UrlParser';
import { RetryHandler } from '../utils/RetryHandler';
import { LinkValidator } from '../validators/LinkValidator';
import { InvalidFeedError, ParseError, BrowserError } from '../errors/RssReaderErrors';

/**
 * Main entry point for RSS feed reading with Puppeteer-based scraping.
 * Handles JavaScript-rendered feeds, extracts links, and provides comprehensive parsing.
 *
 * @example
 * ```typescript
 * const reader = new RssReader({
 *   titleSuffixPattern: /[–-]\s*FitGirl Repacks/,
 *   browserPoolSize: 2,
 *   retryAttempts: 3
 * });
 *
 * await reader.initialize();
 *
 * try {
 *   const feed = await reader.fetchAndParse('https://fitgirl-repacks.site/feed/');
 *   console.log(`Found ${feed.items.length} items`);
 *
 *   for (const item of feed.items) {
 *     console.log(`${item.title}: ${item.links.length} links`);
 *   }
 * } finally {
 *   await reader.close();
 * }
 * ```
 */
export class RssReader {
  private readonly config: RssReaderConfig & {
    browserPoolSize: number;
    retryAttempts: number;
    timeout: number;
    itemIdPattern: RegExp;
    disableSandbox: boolean;
  };
  private readonly browserPool: BrowserPool;
  private readonly feedFetcher: FeedFetcher;
  private readonly itemParser: ItemParser;
  private readonly itemValidator: ItemValidator;
  private readonly retryHandler: RetryHandler;

  /**
   * Create a new RssReader instance
   * @param config - Configuration options for RSS reading
   */
  constructor(config?: RssReaderConfig) {
    // Merge provided config with defaults
    this.config = {
      browserPoolSize: config?.browserPoolSize ?? 2,
      retryAttempts: config?.retryAttempts ?? 3,
      timeout: config?.timeout ?? 30000,
      titleSuffixPattern: config?.titleSuffixPattern ?? undefined,
      titlePrefixPattern: config?.titlePrefixPattern ?? undefined,
      itemIdPattern: config?.itemIdPattern ?? /[?&]p=(\d+)/,
      linkValidationPattern: config?.linkValidationPattern ?? undefined,
      disableSandbox: config?.disableSandbox ?? false,
    };

    // Initialize dependencies
    this.browserPool = new BrowserPool({
      poolSize: this.config.browserPoolSize,
      disableSandbox: this.config.disableSandbox,
    });
    this.feedFetcher = new FeedFetcher();
    this.itemParser = ItemParser.createDefault(this.config);
    this.itemValidator = new ItemValidator();
    this.retryHandler = new RetryHandler({
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    });
  }

  /**
   * Initialize the RSS reader (launches browser pool)
   * MUST be called before fetchAndParse()
   * @throws BrowserError if browser pool initialization fails
   *
   * @example
   * ```typescript
   * const reader = new RssReader();
   * await reader.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    await this.browserPool.initialize();
  }

  /**
   * Fetch and parse an RSS feed
   * @param feedUrl - URL of the RSS feed to fetch
   * @returns Parsed RSS feed with all items
   * @throws FeedFetchError if fetching fails
   * @throws InvalidFeedError if feed structure is invalid
   * @throws ParseError if item parsing fails
   *
   * @example
   * ```typescript
   * const reader = new RssReader();
   * await reader.initialize();
   *
   * try {
   *   const feed = await reader.fetchAndParse('https://example.com/feed.xml');
   *   console.log(`Feed: ${feed.title}`);
   *   console.log(`Items: ${feed.items.length}`);
   * } finally {
   *   await reader.close();
   * }
   * ```
   */
  async fetchAndParse(feedUrl: string): Promise<RssFeed> {
    // Check pool is initialized before attempting operations
    if (!this.browserPool.isInitialized()) {
      throw new BrowserError(
        'Browser pool not initialized. Call initialize() first.',
        'fetchAndParse'
      );
    }

    // Fetch feed XML with retry logic
    const xml = await this.retryHandler.executeWithRetry(
      async () => {
        const browser = await this.browserPool.acquire();
        try {
          return await this.feedFetcher.fetchFeed(
            feedUrl,
            browser,
            this.config.timeout
          );
        } finally {
          await this.browserPool.release(browser);
        }
      },
      this.config.retryAttempts
    );

    // Parse XML to JavaScript object
    const feedData = await this.parseXml(xml, feedUrl);

    // Extract feed metadata
    const feedTitle = this.extractFeedTitle(feedData);
    const feedDescription = this.extractFeedDescription(feedData);

    // Extract raw items
    const rawItems = this.extractRawItems(feedData, feedUrl);

    // Parse each item
    const items = await this.parseItems(rawItems, feedUrl);

    // Deduplicate items by link
    const deduplicatedItems = this.deduplicateItems(items);

    // Construct and return the feed
    return {
      title: feedTitle,
      feedUrl,
      description: feedDescription,
      items: deduplicatedItems,
      fetchedAt: new Date(),
    };
  }

  /**
   * Close the RSS reader and cleanup resources
   * MUST be called when done to prevent zombie browser processes
   *
   * @example
   * ```typescript
   * const reader = new RssReader();
   * await reader.initialize();
   * try {
   *   // Use reader...
   * } finally {
   *   await reader.close();
   * }
   * ```
   */
  async close(): Promise<void> {
    await this.browserPool.close();
  }

  /**
   * Get browser pool statistics
   * @returns Current pool statistics
   */
  getPoolStats() {
    return this.browserPool.getStats();
  }

  /**
   * Check if reader is initialized
   * @returns true if initialized
   */
  isInitialized(): boolean {
    return this.browserPool.isInitialized();
  }

  /**
   * Parse XML string to JavaScript object using xml2js
   * @param xml - XML string
   * @param feedUrl - Feed URL for error context
   * @returns Parsed feed data
   */
  private async parseXml(xml: string, feedUrl: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      parseString(xml, { trim: true, normalize: true }, (err, result) => {
        if (err) {
          reject(
            new InvalidFeedError(
              `Failed to parse XML: ${err.message}`,
              feedUrl,
              err
            )
          );
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Extract feed title from parsed XML
   * @param feedData - Parsed feed data
   * @returns Feed title or 'Unknown Feed'
   */
  private extractFeedTitle(feedData: unknown): string {
    try {
      const data = feedData as {
        rss?: { channel?: Array<{ title?: string[] }> };
        feed?: { title?: string[] };
      };

      // RSS 2.0 format
      if (data.rss?.channel?.[0]?.title?.[0]) {
        return data.rss.channel[0].title[0];
      }

      // Atom format
      if (data.feed?.title?.[0]) {
        return data.feed.title[0];
      }

      return 'Unknown Feed';
    } catch {
      return 'Unknown Feed';
    }
  }

  /**
   * Extract feed description from parsed XML
   * @param feedData - Parsed feed data
   * @returns Feed description or undefined
   */
  private extractFeedDescription(feedData: unknown): string | undefined {
    try {
      const data = feedData as {
        rss?: { channel?: Array<{ description?: string[] }> };
        feed?: { subtitle?: string[] };
      };

      // RSS 2.0 format
      if (data.rss?.channel?.[0]?.description?.[0]) {
        return data.rss.channel[0].description[0];
      }

      // Atom format
      if (data.feed?.subtitle?.[0]) {
        return data.feed.subtitle[0];
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract raw items from parsed feed data
   * @param feedData - Parsed feed data
   * @param feedUrl - Feed URL for error context
   * @returns Array of raw items
   */
  private extractRawItems(feedData: unknown, feedUrl: string): RawRssItem[] {
    try {
      const data = feedData as {
        rss?: { channel?: Array<{ item?: RawRssItem[] }> };
        feed?: { entry?: RawRssItem[] };
      };

      // RSS 2.0 format
      if (data.rss?.channel?.[0]?.item) {
        return data.rss.channel[0].item;
      }

      // Atom format
      if (data.feed?.entry) {
        return data.feed.entry;
      }

      throw new InvalidFeedError(
        'Feed does not contain valid RSS or Atom structure',
        feedUrl
      );
    } catch (error) {
      if (error instanceof InvalidFeedError) {
        throw error;
      }

      throw new InvalidFeedError(
        'Failed to extract items from feed',
        feedUrl,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse raw items into RssItem objects
   * @param rawItems - Raw items from XML
   * @param feedUrl - Feed URL for error context
   * @returns Array of parsed items
   */
  private async parseItems(
    rawItems: RawRssItem[],
    feedUrl: string
  ): Promise<RssItem[]> {
    const items: RssItem[] = [];
    const errors: ParseError[] = [];

    // Parse items sequentially to maintain order
    for (const rawItem of rawItems) {
      try {
        const item = await this.itemParser.parseItem(rawItem, feedUrl);
        this.itemValidator.validate(item);
        items.push(item);
      } catch (error) {
        // Collect parse errors but continue processing other items
        if (error instanceof ParseError) {
          errors.push(error);
        } else {
          const title = Array.isArray(rawItem.title) ? rawItem.title[0] : 'Unknown';
          errors.push(
            new ParseError(
              `Failed to parse item: ${error instanceof Error ? error.message : String(error)}`,
              feedUrl,
              title,
              error instanceof Error ? error : undefined
            )
          );
        }
      }
    }

    // If all items failed to parse, throw the first error
    if (items.length === 0 && errors.length > 0) {
      throw errors[0];
    }

    return items;
  }

  /**
   * Deduplicate items by link URL
   * @param items - Items to deduplicate
   * @returns Deduplicated items
   */
  private deduplicateItems(items: RssItem[]): RssItem[] {
    const seen = new Set<string>();
    const deduplicated: RssItem[] = [];

    for (const item of items) {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }

  /**
   * Static utility: Extract links from HTML content
   * @param html - HTML content
   * @returns Array of links
   */
  static extractLinks(html: string): string[] {
    return LinkExtractor.extract(html);
  }

  /**
   * Static utility: Extract item ID from URL
   * @param url - URL to parse
   * @param pattern - Optional regex pattern
   * @returns Extracted ID or undefined
   */
  static extractItemId(url: string, pattern?: RegExp): string | undefined {
    return UrlParser.extractId(url, pattern);
  }

  /**
   * Static utility: Clean title
   * @param title - Title to clean
   * @param options - Cleaning options
   * @returns Cleaned title
   */
  static cleanTitle(title: string, options?: TitleCleanOptions): string {
    return TitleCleaner.clean(title, options);
  }

  /**
   * Static utility: Validate link
   * @param link - Link to validate
   * @param pattern - Optional validation pattern
   * @returns true if valid
   */
  static validateLink(link: string, pattern?: RegExp): boolean {
    return LinkValidator.isValid(link, pattern);
  }
}
