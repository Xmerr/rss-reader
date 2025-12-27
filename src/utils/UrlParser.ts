/**
 * Utility for extracting item IDs from URLs using regex patterns
 */

import type { IUrlParser } from '../interfaces';

/**
 * Extracts item IDs from URLs using configurable regex patterns.
 * Default pattern matches WordPress-style URLs (e.g., ?p=12345).
 */
export class UrlParser implements IUrlParser {
  /** Default pattern for WordPress-style item IDs (?p=12345 or &p=12345) */
  private static readonly DEFAULT_PATTERN = /[?&]p=(\d+)/;

  /**
   * Extract item ID from URL using the provided pattern or default pattern
   * @param url - The URL to extract ID from
   * @param pattern - Optional regex pattern with a capture group (defaults to WordPress-style)
   * @returns Extracted ID string or undefined if no match found
   *
   * @example
   * ```typescript
   * const parser = new UrlParser();
   *
   * // WordPress-style URL
   * parser.extractItemId('https://example.com/?p=12345'); // Returns: "12345"
   *
   * // Custom pattern for different URL structure
   * parser.extractItemId('https://example.com/post/98765', /\/post\/(\d+)/); // Returns: "98765"
   *
   * // No match
   * parser.extractItemId('https://example.com/page'); // Returns: undefined
   * ```
   */
  extractItemId(url: string, pattern?: RegExp): string | undefined {
    // Use provided pattern or fall back to default
    const regexPattern = pattern ?? UrlParser.DEFAULT_PATTERN;

    try {
      // Execute regex against URL
      const match = regexPattern.exec(url);

      // Return first capture group if match found
      // Note: match[0] is full match, match[1] is first capture group
      if (match && match[1]) {
        return match[1];
      }

      return undefined;
    } catch (error) {
      // Invalid regex or execution error - return undefined
      // This prevents regex errors from crashing the parsing flow
      return undefined;
    }
  }

  /**
   * Static utility method for one-off ID extraction without instantiation
   * @param url - The URL to extract ID from
   * @param pattern - Optional regex pattern
   * @returns Extracted ID or undefined
   */
  static extractId(url: string, pattern?: RegExp): string | undefined {
    const parser = new UrlParser();
    return parser.extractItemId(url, pattern);
  }
}
