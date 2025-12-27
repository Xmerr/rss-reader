/**
 * Core type definitions for @xmer/rss-reader
 */

/**
 * Configuration options for RssReader
 */
export interface RssReaderConfig {
  /** Pattern to remove from end of titles (e.g., /[–-]\s*FitGirl Repacks/) */
  titleSuffixPattern?: RegExp;

  /** Pattern to remove from start of titles */
  titlePrefixPattern?: RegExp;

  /** Pattern to extract item ID from URLs (e.g., /[?&]p=(\d+)/) */
  itemIdPattern?: RegExp;

  /** Number of browser instances in pool (default: 2) */
  browserPoolSize?: number;

  /** Maximum retry attempts for transient failures (default: 3) */
  retryAttempts?: number;

  /** Timeout for feed fetching in milliseconds (default: 30000) */
  timeout?: number;

  /** Optional regex pattern to validate extracted links */
  linkValidationPattern?: RegExp;

  /**
   * Disable Chrome security sandbox (default: false)
   *
   * WARNING: Only set to true in controlled Docker/CI environments.
   * Disabling the sandbox removes Chrome's process isolation security.
   *
   * @see https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux/sandboxing.md
   */
  disableSandbox?: boolean;
}

/**
 * Options for title cleaning
 */
export interface TitleCleanOptions {
  /** Remove suffix pattern */
  suffixPattern?: RegExp;

  /** Remove prefix pattern */
  prefixPattern?: RegExp;
}

/**
 * Parsed RSS item with extracted links and metadata
 */
export interface RssItem {
  /** Item title (cleaned) */
  title: string;

  /** Item link/URL */
  link: string;

  /** Publication date */
  publishedAt: Date;

  /** All extracted links from content (HTTP, magnet, etc.) */
  links: string[];

  /** Optional item ID extracted from URL */
  itemId?: string;

  /**
   * Optional raw HTML content from feed
   *
   * WARNING: This content is NOT sanitized and may contain malicious scripts.
   * Do NOT render this content directly using innerHTML or similar DOM manipulation.
   * Always sanitize with a library like DOMPurify before displaying to users.
   *
   * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
   */
  rawContent?: string;

  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete RSS feed with all items
 */
export interface RssFeed {
  /** Feed title */
  title: string;

  /** Feed URL */
  feedUrl: string;

  /** Feed description */
  description?: string;

  /** Parsed items */
  items: RssItem[];

  /** Fetch timestamp */
  fetchedAt: Date;
}

/**
 * Raw RSS item from xml2js parser
 */
export interface RawRssItem {
  title?: string[];
  link?: string[];
  pubDate?: string[];
  'content:encoded'?: string[];
  description?: string[];
  guid?: Array<{ _: string; $: { isPermaLink?: string } }>;
  [key: string]: unknown;
}

/**
 * Browser pool statistics
 */
export interface BrowserPoolStats {
  /** Total browsers in pool */
  total: number;

  /** Available browsers */
  available: number;

  /** Browsers in use */
  inUse: number;
}
