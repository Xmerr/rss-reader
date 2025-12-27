/**
 * Service for fetching RSS feeds using Puppeteer
 */

import type { Browser } from 'puppeteer';
import type { IFeedFetcher } from '../interfaces';
import { FeedFetchError } from '../errors/RssReaderErrors';

/**
 * Fetches RSS feed content using Puppeteer browser automation.
 * Required for JavaScript-rendered feeds that don't work with static HTTP clients.
 */
export class FeedFetcher implements IFeedFetcher {
  /** Default timeout for feed fetching (30 seconds) */
  private static readonly DEFAULT_TIMEOUT = 30000;

  /**
   * Fetch RSS feed content from URL using Puppeteer
   * @param feedUrl - The RSS feed URL to fetch
   * @param browser - Puppeteer browser instance to use
   * @param timeout - Optional timeout in milliseconds (defaults to 30000)
   * @returns Raw XML string content
   * @throws FeedFetchError if fetching fails
   *
   * @example
   * ```typescript
   * const fetcher = new FeedFetcher();
   * const browser = await puppeteer.launch();
   *
   * try {
   *   const xml = await fetcher.fetchFeed(
   *     'https://example.com/feed.xml',
   *     browser,
   *     30000
   *   );
   *   console.log('Fetched XML:', xml);
   * } finally {
   *   await browser.close();
   * }
   * ```
   */
  async fetchFeed(
    feedUrl: string,
    browser: Browser,
    timeout?: number
  ): Promise<string> {
    // Validate inputs
    if (!feedUrl || typeof feedUrl !== 'string') {
      throw new FeedFetchError('Feed URL is required', feedUrl);
    }

    // Validate URL protocol - only allow HTTP/HTTPS for security
    if (!/^https?:\/\//i.test(feedUrl)) {
      throw new FeedFetchError(
        'Invalid feed URL: must use HTTP or HTTPS protocol',
        feedUrl
      );
    }

    if (!browser) {
      throw new FeedFetchError('Browser instance is required', feedUrl);
    }

    const fetchTimeout = timeout ?? FeedFetcher.DEFAULT_TIMEOUT;

    let page;

    try {
      // Create a new page
      page = await browser.newPage();

      // Set timeout for navigation
      page.setDefaultNavigationTimeout(fetchTimeout);
      page.setDefaultTimeout(fetchTimeout);

      // Navigate to the feed URL
      // Use 'networkidle2' to wait for network to be mostly idle
      // This ensures JavaScript-rendered content is loaded
      const response = await page.goto(feedUrl, {
        waitUntil: 'networkidle2',
        timeout: fetchTimeout,
      });

      // Check if navigation was successful
      if (!response) {
        throw new FeedFetchError(
          'Failed to navigate to feed URL: no response received',
          feedUrl
        );
      }

      // Check response status
      const status = response.status();
      if (status < 200 || status >= 400) {
        throw new FeedFetchError(
          `Failed to fetch feed: HTTP ${status}`,
          feedUrl
        );
      }

      // Get the raw response text (XML)
      // Note: page.content() returns HTML wrapper, response.text() gives raw content
      const content = await response.text();

      // Validate content is not empty
      if (!content || content.trim().length === 0) {
        throw new FeedFetchError(
          'Feed content is empty',
          feedUrl
        );
      }

      return content;
    } catch (error) {
      // If error is already a FeedFetchError, re-throw it
      if (error instanceof FeedFetchError) {
        throw error;
      }

      // Wrap other errors in FeedFetchError
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FeedFetchError(
        `Failed to fetch feed: ${errorMessage}`,
        feedUrl,
        error instanceof Error ? error : undefined
      );
    } finally {
      // Always close the page to prevent memory leaks
      if (page) {
        try {
          await page.close();
        } catch {
          // Ignore close errors - page may already be closed
        }
      }
    }
  }

  /**
   * Fetch feed with custom user agent
   * @param feedUrl - Feed URL
   * @param browser - Browser instance
   * @param userAgent - Custom user agent string
   * @param timeout - Optional timeout
   * @returns Raw XML string
   */
  async fetchFeedWithUserAgent(
    feedUrl: string,
    browser: Browser,
    userAgent: string,
    timeout?: number
  ): Promise<string> {
    if (!browser) {
      throw new FeedFetchError('Browser instance is required', feedUrl);
    }

    let page;

    try {
      page = await browser.newPage();
      await page.setUserAgent(userAgent);

      const fetchTimeout = timeout ?? FeedFetcher.DEFAULT_TIMEOUT;
      page.setDefaultNavigationTimeout(fetchTimeout);
      page.setDefaultTimeout(fetchTimeout);

      const response = await page.goto(feedUrl, {
        waitUntil: 'networkidle2',
        timeout: fetchTimeout,
      });

      if (!response) {
        throw new FeedFetchError(
          'Failed to navigate to feed URL: no response received',
          feedUrl
        );
      }

      const status = response.status();
      if (status < 200 || status >= 400) {
        throw new FeedFetchError(
          `Failed to fetch feed: HTTP ${status}`,
          feedUrl
        );
      }

      // Get the raw response text (XML)
      const content = await response.text();

      if (!content || content.trim().length === 0) {
        throw new FeedFetchError('Feed content is empty', feedUrl);
      }

      return content;
    } catch (error) {
      if (error instanceof FeedFetchError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FeedFetchError(
        `Failed to fetch feed: ${errorMessage}`,
        feedUrl,
        error instanceof Error ? error : undefined
      );
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // Ignore close errors
        }
      }
    }
  }
}
