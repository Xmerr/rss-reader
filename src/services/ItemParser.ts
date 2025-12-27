/**
 * Service for parsing individual RSS items from raw XML structure
 */

import type { IItemParser, ILinkExtractor, ITitleCleaner, IUrlParser, IDateParser } from '../interfaces';
import type { RawRssItem, RssItem, RssReaderConfig } from '../types';
import { ParseError } from '../errors/RssReaderErrors';
import { LinkExtractor } from './LinkExtractor';
import { TitleCleaner } from './TitleCleaner';
import { UrlParser } from '../utils/UrlParser';
import { DateParser } from '../utils/DateParser';

/**
 * Parses individual RSS items from raw XML structure into RssItem objects.
 * Orchestrates title cleaning, date parsing, link extraction, and item ID extraction.
 */
export class ItemParser implements IItemParser {
  /**
   * Create a new ItemParser with injected dependencies
   * @param linkExtractor - Service for extracting links from HTML
   * @param titleCleaner - Service for cleaning titles
   * @param urlParser - Utility for extracting item IDs from URLs
   * @param dateParser - Utility for parsing dates
   * @param config - Optional RSS reader configuration
   */
  constructor(
    private readonly linkExtractor: ILinkExtractor,
    private readonly titleCleaner: ITitleCleaner,
    private readonly urlParser: IUrlParser,
    private readonly dateParser: IDateParser,
    private readonly config?: RssReaderConfig
  ) {}

  /**
   * Parse a raw RSS item into an RssItem object
   * @param rawItem - Raw item from xml2js parser
   * @param feedUrl - Source feed URL for error context
   * @returns Parsed and validated RssItem
   * @throws ParseError if required fields are missing or invalid
   *
   * @example
   * ```typescript
   * const parser = new ItemParser(
   *   new LinkExtractor(),
   *   new TitleCleaner(),
   *   new UrlParser(),
   *   new DateParser(),
   *   config
   * );
   *
   * const rawItem = {
   *   title: ['Game Title – FitGirl Repacks'],
   *   link: ['https://example.com/?p=12345'],
   *   pubDate: ['Mon, 01 Jan 2024 12:00:00 +0000'],
   *   'content:encoded': ['<p>Download: <a href="magnet:...">Magnet</a></p>']
   * };
   *
   * const item = await parser.parseItem(rawItem, 'https://example.com/feed');
   * ```
   */
  async parseItem(rawItem: RawRssItem, feedUrl: string): Promise<RssItem> {
    try {
      // Extract title (required)
      const rawTitle = this.extractFirstValue(rawItem.title);
      if (!rawTitle) {
        throw new ParseError(
          'Item is missing required field: title',
          feedUrl,
          'Unknown'
        );
      }

      // Clean title using configured patterns
      const title = this.titleCleaner.cleanTitle(rawTitle, {
        suffixPattern: this.config?.titleSuffixPattern,
        prefixPattern: this.config?.titlePrefixPattern,
      });

      // Extract link (required)
      const link = this.extractFirstValue(rawItem.link);
      if (!link) {
        throw new ParseError(
          'Item is missing required field: link',
          feedUrl,
          title
        );
      }

      // Extract and parse publication date (required)
      const pubDateString = this.extractFirstValue(rawItem.pubDate);
      if (!pubDateString) {
        throw new ParseError(
          'Item is missing required field: pubDate',
          feedUrl,
          title
        );
      }

      const publishedAt = this.dateParser.parseDate(pubDateString);
      if (!publishedAt) {
        throw new ParseError(
          `Failed to parse publication date: ${pubDateString}`,
          feedUrl,
          title
        );
      }

      // Extract HTML content from content:encoded or description
      // Prefer content:encoded (more complete), fall back to description
      const rawContent =
        this.extractFirstValue(rawItem['content:encoded']) ||
        this.extractFirstValue(rawItem.description) ||
        '';

      // Extract all links from HTML content
      const links = this.linkExtractor.extractLinks(rawContent);

      // Extract item ID from link URL (optional)
      const itemId = this.urlParser.extractItemId(
        link,
        this.config?.itemIdPattern
      );

      // Extract additional metadata (optional)
      const metadata = this.extractMetadata(rawItem);

      // Construct the parsed item
      const item: RssItem = {
        title,
        link,
        publishedAt,
        links,
        itemId,
        rawContent: rawContent.length > 0 ? rawContent : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      return item;
    } catch (error) {
      // If error is already a ParseError, re-throw it
      if (error instanceof ParseError) {
        throw error;
      }

      // Wrap other errors in ParseError
      const errorMessage = error instanceof Error ? error.message : String(error);
      const title = this.extractFirstValue(rawItem.title) || 'Unknown';
      throw new ParseError(
        `Failed to parse item: ${errorMessage}`,
        feedUrl,
        title,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extract first value from xml2js array format
   * xml2js returns fields as arrays (e.g., title: ['value'])
   * @param value - Value from xml2js (array or undefined)
   * @returns First string value or undefined
   */
  private extractFirstValue(value: string[] | undefined): string | undefined {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return undefined;
    }

    const firstValue = value[0];
    if (typeof firstValue !== 'string') {
      return undefined;
    }

    return firstValue.trim();
  }

  /**
   * Extract metadata from raw item
   * Captures fields beyond the standard RSS fields for future extensibility
   * @param rawItem - Raw RSS item
   * @returns Metadata object
   */
  private extractMetadata(rawItem: RawRssItem): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Standard fields that are handled separately
    const standardFields = [
      'title',
      'link',
      'pubDate',
      'content:encoded',
      'description',
    ];

    // Extract any additional fields as metadata
    for (const [key, value] of Object.entries(rawItem)) {
      if (!standardFields.includes(key)) {
        // Store the raw value (may be array from xml2js)
        metadata[key] = value;
      }
    }

    // Extract GUID if present
    if (rawItem['guid']) {
      const guidValue = Array.isArray(rawItem['guid']) && rawItem['guid'].length > 0
        ? rawItem['guid'][0]
        : undefined;

      if (guidValue) {
        // GUID can be string or object with _ and $ properties
        if (typeof guidValue === 'string') {
          metadata['guid'] = guidValue;
        } else if (typeof guidValue === 'object' && guidValue !== null) {
          const guidObj = guidValue as { _: string; $?: { isPermaLink?: string } };
          metadata['guid'] = guidObj._;
          if (guidObj.$ && guidObj.$.isPermaLink) {
            metadata['guidIsPermaLink'] = guidObj.$.isPermaLink === 'true';
          }
        }
      }
    }

    return metadata;
  }

  /**
   * Create a default ItemParser with standard dependencies
   * @param config - Optional RSS reader configuration
   * @returns Configured ItemParser instance
   */
  static createDefault(config?: RssReaderConfig): ItemParser {
    return new ItemParser(
      new LinkExtractor(),
      new TitleCleaner(),
      new UrlParser(),
      new DateParser(),
      config
    );
  }
}
