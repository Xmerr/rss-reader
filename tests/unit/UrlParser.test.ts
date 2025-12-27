/**
 * Unit tests for UrlParser
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UrlParser } from '../../src/utils/UrlParser';

describe('UrlParser', () => {
  let parser: UrlParser;

  beforeEach(() => {
    parser = new UrlParser();
  });

  describe('extractItemId', () => {
    describe('WordPress-style patterns (default)', () => {
      it('should extract WordPress-style item ID with question mark', () => {
        const url = 'https://example.com/?p=12345';
        const id = parser.extractItemId(url);

        expect(id).toBe('12345');
      });

      it('should extract item ID with ampersand separator', () => {
        const url = 'https://example.com/page?foo=bar&p=98765';
        const id = parser.extractItemId(url);

        expect(id).toBe('98765');
      });

      it('should extract item ID from FitGirl-style URL', () => {
        const url = 'https://fitgirl-repacks.site/?p=98765';
        const id = parser.extractItemId(url);

        expect(id).toBe('98765');
      });

      it('should extract item ID with multiple query parameters', () => {
        const url = 'https://example.com/?utm_source=rss&p=54321&utm_medium=feed';
        const id = parser.extractItemId(url);

        expect(id).toBe('54321');
      });

      it('should extract item ID with fragment', () => {
        const url = 'https://example.com/?p=12345#section';
        const id = parser.extractItemId(url);

        expect(id).toBe('12345');
      });
    });

    describe('custom patterns', () => {
      it('should extract item ID using custom slash pattern', () => {
        const url = 'https://example.com/post/12345/title';
        const pattern = /\/post\/(\d+)\//;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBe('12345');
      });

      it('should extract item ID using custom article pattern', () => {
        const url = 'https://example.com/article-98765';
        const pattern = /article-(\d+)/;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBe('98765');
      });

      it('should extract alphanumeric ID with custom pattern', () => {
        const url = 'https://example.com/item/abc123xyz';
        const pattern = /\/item\/([a-z0-9]+)/i;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBe('abc123xyz');
      });

      it('should extract UUID-style ID with custom pattern', () => {
        const url = 'https://example.com/post/550e8400-e29b-41d4-a716-446655440000';
        const pattern = /\/post\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBe('550e8400-e29b-41d4-a716-446655440000');
      });

      it('should return first capture group from pattern', () => {
        const url = 'https://example.com/category/tech/post/12345';
        const pattern = /\/post\/(\d+)/;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBe('12345');
      });
    });

    describe('edge cases and error handling', () => {
      it('should return undefined for URL without item ID', () => {
        const url = 'https://example.com/page';
        const id = parser.extractItemId(url);

        expect(id).toBeUndefined();
      });

      it('should return undefined for custom pattern without match', () => {
        const url = 'https://example.com/page';
        const pattern = /\/post\/(\d+)\//;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBeUndefined();
      });

      it('should return undefined for empty string', () => {
        const id = parser.extractItemId('');

        expect(id).toBeUndefined();
      });

      it('should return undefined for pattern without capture group', () => {
        const url = 'https://example.com/post/12345';
        const pattern = /\/post\/\d+/; // No capture group
        const id = parser.extractItemId(url, pattern);

        expect(id).toBeUndefined();
      });

      it('should return undefined for pattern with empty capture', () => {
        const url = 'https://example.com/post/';
        const pattern = /\/post\/(\d+)?/;
        const id = parser.extractItemId(url, pattern);

        expect(id).toBeUndefined();
      });

      it('should handle invalid regex pattern gracefully', () => {
        const url = 'https://example.com/?p=12345';
        // Create a pattern that throws on exec
        const invalidPattern = /valid/;
        Object.defineProperty(invalidPattern, 'exec', {
          value: () => {
            throw new Error('Invalid regex execution');
          }
        });

        const id = parser.extractItemId(url, invalidPattern);

        expect(id).toBeUndefined();
      });

      it('should handle malformed URLs', () => {
        const url = 'not-a-valid-url';
        const id = parser.extractItemId(url);

        expect(id).toBeUndefined();
      });

      it('should handle URLs with only parameter name but no value', () => {
        const url = 'https://example.com/?p=';
        const id = parser.extractItemId(url);

        expect(id).toBeUndefined();
      });
    });

    describe('real-world scenarios', () => {
      it('should extract ID from FitGirl Repacks feed URLs', () => {
        const urls = [
          'https://fitgirl-repacks.site/?p=98765',
          'https://fitgirl-repacks.site/?p=98766',
          'https://fitgirl-repacks.site/?p=98767'
        ];

        const ids = urls.map(url => parser.extractItemId(url));

        expect(ids).toEqual(['98765', '98766', '98767']);
      });

      it('should extract ID from WordPress blog posts', () => {
        const url = 'https://myblog.com/?p=42&preview=true';
        const id = parser.extractItemId(url);

        expect(id).toBe('42');
      });

      it('should handle HTTPS and HTTP protocols', () => {
        const httpsUrl = 'https://example.com/?p=12345';
        const httpUrl = 'http://example.com/?p=12345';

        expect(parser.extractItemId(httpsUrl)).toBe('12345');
        expect(parser.extractItemId(httpUrl)).toBe('12345');
      });
    });
  });

  describe('static extractId', () => {
    it('should extract ID without instantiation', () => {
      const url = 'https://example.com/?p=12345';
      const id = UrlParser.extractId(url);

      expect(id).toBe('12345');
    });

    it('should work with custom pattern', () => {
      const url = 'https://example.com/post/67890';
      const pattern = /\/post\/(\d+)/;
      const id = UrlParser.extractId(url, pattern);

      expect(id).toBe('67890');
    });

    it('should return undefined for no match', () => {
      const url = 'https://example.com/page';
      const id = UrlParser.extractId(url);

      expect(id).toBeUndefined();
    });
  });
});

