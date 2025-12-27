/**
 * Service for extracting links from HTML content
 */

import * as cheerio from 'cheerio';
import type { ILinkExtractor } from '../interfaces';

/**
 * Extracts all links (HTTP, HTTPS, magnet, etc.) from HTML content using Cheerio.
 * Designed to extract download links, article links, and magnet links from RSS item content.
 */
export class LinkExtractor implements ILinkExtractor {
  /**
   * Extract all links from HTML content
   * @param html - HTML content string
   * @returns Array of extracted links (all types: HTTP, HTTPS, magnet, etc.)
   *
   * @example
   * ```typescript
   * const extractor = new LinkExtractor();
   *
   * const html = `
   *   <p>Download here:</p>
   *   <a href="https://example.com/download">HTTP Link</a>
   *   <a href="magnet:?xt=urn:btih:12345">Magnet Link</a>
   * `;
   *
   * extractor.extractLinks(html);
   * // Returns: ['https://example.com/download', 'magnet:?xt=urn:btih:12345']
   * ```
   */
  extractLinks(html: string): string[] {
    // Validate input
    if (!html || typeof html !== 'string') {
      return [];
    }

    try {
      // Load HTML with Cheerio
      const $ = cheerio.load(html);

      // Extract all href attributes from <a> tags
      const links: string[] = [];

      // Use Cheerio to find all anchor tags
      $('a').each((_, element) => {
        const href = $(element).attr('href');

        // Only add non-empty href values
        if (href && href.trim().length > 0) {
          links.push(href.trim());
        }
      });

      // Remove duplicates while preserving order
      // Use Set to track seen links, then filter
      const seen = new Set<string>();
      const uniqueLinks = links.filter(link => {
        if (seen.has(link)) {
          return false;
        }
        seen.add(link);
        return true;
      });

      return uniqueLinks;
    } catch (error) {
      // Cheerio parsing failed - return empty array
      // This handles malformed HTML gracefully
      return [];
    }
  }

  /**
   * Extract links and categorize them by type
   * @param html - HTML content string
   * @returns Object with links categorized by type
   */
  extractLinksByType(html: string): {
    http: string[];
    magnet: string[];
    other: string[];
  } {
    const allLinks = this.extractLinks(html);

    const categorized = {
      http: [] as string[],
      magnet: [] as string[],
      other: [] as string[],
    };

    for (const link of allLinks) {
      if (/^https?:\/\//i.test(link)) {
        categorized.http.push(link);
      } else if (/^magnet:/i.test(link)) {
        categorized.magnet.push(link);
      } else {
        categorized.other.push(link);
      }
    }

    return categorized;
  }

  /**
   * Extract only HTTP/HTTPS links
   * @param html - HTML content string
   * @returns Array of HTTP/HTTPS links
   */
  extractHttpLinks(html: string): string[] {
    return this.extractLinks(html).filter(link => /^https?:\/\//i.test(link));
  }

  /**
   * Extract only magnet links
   * @param html - HTML content string
   * @returns Array of magnet links
   */
  extractMagnetLinks(html: string): string[] {
    return this.extractLinks(html).filter(link => /^magnet:/i.test(link));
  }

  /**
   * Static utility method for one-off link extraction without instantiation
   * @param html - HTML content string
   * @returns Array of extracted links
   */
  static extract(html: string): string[] {
    const extractor = new LinkExtractor();
    return extractor.extractLinks(html);
  }
}
