/**
 * Service for cleaning and normalizing RSS item titles
 */

import type { ITitleCleaner } from '../interfaces';
import type { TitleCleanOptions } from '../types';

/**
 * Cleans and normalizes item titles by removing configured patterns and whitespace.
 * Used to remove site branding, prefixes, or suffixes from RSS item titles.
 */
export class TitleCleaner implements ITitleCleaner {
  /**
   * Clean a title by removing configured patterns and normalizing whitespace
   * @param title - Original title to clean
   * @param options - Cleaning options (suffix/prefix patterns)
   * @returns Cleaned title
   */
  cleanTitle(title: string, options?: TitleCleanOptions): string {
    // Validate input
    if (!title || typeof title !== 'string') {
      return '';
    }

    let cleaned = title;

    // Remove prefix pattern if provided
    if (options?.prefixPattern) {
      try {
        cleaned = cleaned.replace(options.prefixPattern, '');
      } catch (error) {
        // Invalid regex - continue with original title
        // This prevents regex errors from breaking the cleaning flow
      }
    }

    // Remove suffix pattern if provided
    if (options?.suffixPattern) {
      try {
        cleaned = cleaned.replace(options.suffixPattern, '');
      } catch (error) {
        // Invalid regex - continue with current cleaned value
      }
    }

    // Normalize whitespace:
    // 1. Trim leading/trailing whitespace
    // 2. Replace multiple consecutive whitespace characters with single space
    cleaned = cleaned.trim().replace(/\s+/g, ' ');

    return cleaned;
  }

  /**
   * Clean multiple titles with the same options
   * @param titles - Array of titles to clean
   * @param options - Cleaning options
   * @returns Array of cleaned titles
   */
  cleanTitles(titles: string[], options?: TitleCleanOptions): string[] {
    return titles.map(title => this.cleanTitle(title, options));
  }

  /**
   * Static utility method for one-off title cleaning without instantiation
   * @param title - Title to clean
   * @param options - Cleaning options
   * @returns Cleaned title
   */
  static clean(title: string, options?: TitleCleanOptions): string {
    const cleaner = new TitleCleaner();
    return cleaner.cleanTitle(title, options);
  }

  /**
   * Remove common branding patterns (common use case)
   * @param title - Title to clean
   * @param brandName - Brand name to remove (case-insensitive)
   * @returns Cleaned title
   */
  static removeBranding(title: string, brandName: string): string {
    // Create pattern to match common branding formats:
    // Case-insensitive match for hyphens and vertical bar
    const escapedBrand = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match en dash (U+2013), hyphen, or vertical bar before brand name
    const pattern = new RegExp('\\s*[\\u2013\\-|]\\s*' + escapedBrand + '\\s*$', 'i');

    const cleaner = new TitleCleaner();
    return cleaner.cleanTitle(title, { suffixPattern: pattern });
  }
}
