/**
 * Interface for feed fetching service
 */

import type { Browser } from 'puppeteer';

/**
 * Fetches RSS feeds using Puppeteer
 */
export interface IFeedFetcher {
  /**
   * Fetch RSS feed content from URL
   * @param feedUrl - The RSS feed URL
   * @param browser - Puppeteer browser instance
   * @param timeout - Optional timeout in milliseconds
   * @returns Raw XML string
   */
  fetchFeed(feedUrl: string, browser: Browser, timeout?: number): Promise<string>;
}
