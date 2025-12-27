/**
 * Validator for RSS items
 */

import type { IItemValidator } from '../interfaces';
import type { RssItem } from '../types';
import { ParseError } from '../errors/RssReaderErrors';

/**
 * Validates that RSS items have all required fields.
 * Required fields: title, link, publishedAt, links array.
 * Optional fields: itemId, rawContent, metadata.
 */
export class ItemValidator implements IItemValidator {
  /**
   * Validate that an RSS item has all required fields
   * @param item - Partial item to validate
   * @throws ParseError if validation fails with specific field information
   *
   * @example
   * ```typescript
   * const validator = new ItemValidator();
   *
   * // Valid item
   * validator.validate({
   *   title: 'Test Item',
   *   link: 'https://example.com/item',
   *   publishedAt: new Date(),
   *   links: ['https://example.com/download']
   * }); // No error thrown
   *
   * // Invalid item - missing title
   * validator.validate({
   *   link: 'https://example.com/item',
   *   publishedAt: new Date(),
   *   links: []
   * }); // Throws ParseError
   * ```
   */
  public validate(item: Partial<RssItem>): asserts item is RssItem {
    // Validate title (required, non-empty string)
    if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
      throw new ParseError(
        'Item validation failed: title is required and must be a non-empty string',
        undefined,
        item.title
      );
    }

    // Validate link (required, non-empty string)
    if (!item.link || typeof item.link !== 'string' || item.link.trim().length === 0) {
      throw new ParseError(
        'Item validation failed: link is required and must be a non-empty string',
        undefined,
        item.title
      );
    }

    // Validate publishedAt (required, valid Date)
    if (!item.publishedAt || !(item.publishedAt instanceof Date)) {
      throw new ParseError(
        'Item validation failed: publishedAt is required and must be a Date object',
        undefined,
        item.title
      );
    }

    // Check if date is valid (not NaN)
    if (isNaN(item.publishedAt.getTime())) {
      throw new ParseError(
        'Item validation failed: publishedAt must be a valid Date',
        undefined,
        item.title
      );
    }

    // Validate links (required, must be an array)
    if (!Array.isArray(item.links)) {
      throw new ParseError(
        'Item validation failed: links must be an array',
        undefined,
        item.title
      );
    }

    // Links array can be empty (some items may not have links in content)
    // But it must be an array of strings
    for (const link of item.links) {
      if (typeof link !== 'string') {
        throw new ParseError(
          'Item validation failed: all links must be strings',
          undefined,
          item.title
        );
      }
    }

    // Optional fields validation (if present, must be correct type)
    if (item.itemId !== undefined && typeof item.itemId !== 'string') {
      throw new ParseError(
        'Item validation failed: itemId must be a string if provided',
        undefined,
        item.title
      );
    }

    if (item.rawContent !== undefined && typeof item.rawContent !== 'string') {
      throw new ParseError(
        'Item validation failed: rawContent must be a string if provided',
        undefined,
        item.title
      );
    }

    if (item.metadata !== undefined) {
      if (typeof item.metadata !== 'object' || item.metadata === null || Array.isArray(item.metadata)) {
        throw new ParseError(
          'Item validation failed: metadata must be a non-null object if provided',
          undefined,
          item.title
        );
      }
    }

    // All validations passed - TypeScript now knows item is RssItem
  }

  /**
   * Validate multiple items
   * @param items - Array of items to validate
   * @throws ParseError if any item fails validation
   */
  validateItems(items: Array<Partial<RssItem>>): asserts items is RssItem[] {
    for (const item of items) {
      this.validate(item);
    }
  }

  /**
   * Check if an item is valid without throwing
   * @param item - Item to check
   * @returns true if valid, false otherwise
   */
  isValid(item: Partial<RssItem>): item is RssItem {
    try {
      this.validate(item);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Static utility method for one-off validation without instantiation
   * @param item - Item to validate
   * @throws ParseError if validation fails
   */
  static validateItem(item: Partial<RssItem>): void {
    const validator: ItemValidator = new ItemValidator();
    validator.validate(item);
  }
}
