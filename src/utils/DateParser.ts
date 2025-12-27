/**
 * Utility for parsing RSS date strings to JavaScript Date objects
 */

import type { IDateParser } from '../interfaces';

/**
 * Parses RSS date strings (RFC 822 format) to JavaScript Date objects.
 * Handles common RSS date formats including RFC 822, RFC 2822, and ISO 8601.
 */
export class DateParser implements IDateParser {
  /**
   * Parse RSS date string to Date object
   * @param dateString - RSS date string in RFC 822 format (e.g., "Mon, 01 Jan 2024 12:00:00 +0000")
   * @returns Date object or undefined if parsing fails
   *
   * @example
   * ```typescript
   * const parser = new DateParser();
   *
   * // RFC 822 format (standard RSS)
   * parser.parseDate('Mon, 01 Jan 2024 12:00:00 +0000'); // Valid Date
   *
   * // RFC 2822 format
   * parser.parseDate('Mon, 01 Jan 2024 12:00:00 GMT'); // Valid Date
   *
   * // ISO 8601 format (some feeds use this)
   * parser.parseDate('2024-01-01T12:00:00Z'); // Valid Date
   *
   * // Invalid date
   * parser.parseDate('invalid'); // Returns: undefined
   * ```
   */
  parseDate(dateString: string): Date | undefined {
    // Validate input
    if (!dateString || typeof dateString !== 'string') {
      return undefined;
    }

    // Trim whitespace
    const trimmedDate = dateString.trim();

    if (trimmedDate.length === 0) {
      return undefined;
    }

    try {
      // JavaScript's Date constructor handles RFC 822, RFC 2822, and ISO 8601 formats natively
      const date = new Date(trimmedDate);

      // Check if date is valid
      // Invalid dates return NaN for getTime()
      if (isNaN(date.getTime())) {
        return undefined;
      }

      return date;
    } catch (error) {
      // Date parsing threw an error - return undefined
      return undefined;
    }
  }

  /**
   * Parse date with fallback to current date if parsing fails
   * @param dateString - RSS date string
   * @returns Date object (current date if parsing fails)
   */
  parseDateWithFallback(dateString: string): Date {
    return this.parseDate(dateString) ?? new Date();
  }

  /**
   * Static utility method for one-off date parsing without instantiation
   * @param dateString - RSS date string
   * @returns Date object or undefined
   */
  static parse(dateString: string): Date | undefined {
    const parser = new DateParser();
    return parser.parseDate(dateString);
  }

  /**
   * Validate if a string represents a valid date
   * @param dateString - Date string to validate
   * @returns true if valid date, false otherwise
   */
  static isValidDate(dateString: string): boolean {
    return DateParser.parse(dateString) !== undefined;
  }
}
