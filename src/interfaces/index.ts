/**
 * Service and utility interfaces for @xmer/rss-reader
 */

export { IBrowserPool } from './IBrowserPool';
export { IFeedFetcher } from './IFeedFetcher';

import type { RawRssItem, RssItem, TitleCleanOptions } from '../types';

/**
 * Parses individual RSS items from raw XML structure
 */
export interface IItemParser {
  /**
   * Parse a raw RSS item into an RssItem object
   * @param rawItem - Raw item from xml2js
   * @param feedUrl - Source feed URL
   * @returns Parsed RssItem
   */
  parseItem(rawItem: RawRssItem, feedUrl: string): Promise<RssItem>;
}

/**
 * Extracts links from HTML content
 */
export interface ILinkExtractor {
  /**
   * Extract all links (HTTP, magnet, etc.) from HTML content
   * @param html - HTML content string
   * @returns Array of extracted links
   */
  extractLinks(html: string): string[];
}

/**
 * Cleans and normalizes item titles
 */
export interface ITitleCleaner {
  /**
   * Clean a title by removing configured patterns and whitespace
   * @param title - Original title
   * @param options - Cleaning options
   * @returns Cleaned title
   */
  cleanTitle(title: string, options?: TitleCleanOptions): string;
}

/**
 * Extracts item IDs from URLs
 */
export interface IUrlParser {
  /**
   * Extract item ID from URL using configured pattern
   * @param url - Item URL
   * @param pattern - Optional regex pattern (uses default if not provided)
   * @returns Extracted ID or undefined
   */
  extractItemId(url: string, pattern?: RegExp): string | undefined;
}

/**
 * Parses RSS date strings to Date objects
 */
export interface IDateParser {
  /**
   * Parse RSS date string to Date object
   * @param dateString - RSS date string (RFC 822 format)
   * @returns Date object or undefined if parsing fails
   */
  parseDate(dateString: string): Date | undefined;
}

/**
 * Validates RSS items
 */
export interface IItemValidator {
  /**
   * Validate that an RSS item has all required fields
   * @param item - Item to validate
   * @throws ParseError if validation fails
   */
  validate(item: Partial<RssItem>): asserts item is RssItem;
}

/**
 * Validates link formats
 */
export interface ILinkValidator {
  /**
   * Validate link against optional regex pattern
   * @param link - Link to validate
   * @param pattern - Optional validation pattern
   * @returns true if valid
   */
  validateLink(link: string, pattern?: RegExp): boolean;
}

/**
 * Handles retry logic with exponential backoff
 */
export interface IRetryHandler {
  /**
   * Execute an operation with retry logic
   * @param operation - Async operation to execute
   * @param maxAttempts - Maximum retry attempts
   * @returns Operation result
   */
  executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number
  ): Promise<T>;
}
