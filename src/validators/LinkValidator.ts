/**
 * Validator for link format validation
 */

import type { ILinkValidator } from '../interfaces';

/**
 * Validates link formats against optional regex patterns.
 * Supports HTTP, HTTPS, magnet links, and custom patterns.
 */
export class LinkValidator implements ILinkValidator {
  /** Default pattern that accepts HTTP, HTTPS, and magnet links */
  private static readonly DEFAULT_PATTERN = /^(https?:\/\/|magnet:)/i;

  /**
   * Validate link against optional regex pattern
   * @param link - Link to validate
   * @param pattern - Optional validation pattern (defaults to HTTP/HTTPS/magnet)
   * @returns true if link is valid, false otherwise
   *
   * @example
   * ```typescript
   * const validator = new LinkValidator();
   *
   * // HTTP link
   * validator.validateLink('http://example.com'); // true
   *
   * // HTTPS link
   * validator.validateLink('https://example.com'); // true
   *
   * // Magnet link
   * validator.validateLink('magnet:?xt=urn:btih:...'); // true
   *
   * // Invalid link
   * validator.validateLink('ftp://example.com'); // false
   *
   * // Custom pattern (only HTTPS)
   * validator.validateLink('https://example.com', /^https:\/\//); // true
   * validator.validateLink('http://example.com', /^https:\/\//); // false
   * ```
   */
  validateLink(link: string, pattern?: RegExp): boolean {
    // Validate input
    if (!link || typeof link !== 'string') {
      return false;
    }

    // Trim whitespace
    const trimmedLink = link.trim();

    if (trimmedLink.length === 0) {
      return false;
    }

    try {
      // Use provided pattern or fall back to default
      const validationPattern = pattern ?? LinkValidator.DEFAULT_PATTERN;

      // Test link against pattern
      return validationPattern.test(trimmedLink);
    } catch (error) {
      // Invalid regex or execution error - consider link invalid
      return false;
    }
  }

  /**
   * Validate multiple links
   * @param links - Array of links to validate
   * @param pattern - Optional validation pattern
   * @returns Array of validation results (same order as input)
   */
  validateLinks(links: string[], pattern?: RegExp): boolean[] {
    return links.map(link => this.validateLink(link, pattern));
  }

  /**
   * Filter valid links from an array
   * @param links - Array of links to filter
   * @param pattern - Optional validation pattern
   * @returns Array containing only valid links
   */
  filterValidLinks(links: string[], pattern?: RegExp): string[] {
    return links.filter(link => this.validateLink(link, pattern));
  }

  /**
   * Static utility method for one-off link validation without instantiation
   * @param link - Link to validate
   * @param pattern - Optional validation pattern
   * @returns true if valid
   */
  static isValid(link: string, pattern?: RegExp): boolean {
    const validator = new LinkValidator();
    return validator.validateLink(link, pattern);
  }

  /**
   * Check if a link is an HTTP or HTTPS link
   * @param link - Link to check
   * @returns true if HTTP/HTTPS
   */
  static isHttpLink(link: string): boolean {
    return /^https?:\/\//i.test(link);
  }

  /**
   * Check if a link is a magnet link
   * @param link - Link to check
   * @returns true if magnet link
   */
  static isMagnetLink(link: string): boolean {
    return /^magnet:/i.test(link);
  }
}
