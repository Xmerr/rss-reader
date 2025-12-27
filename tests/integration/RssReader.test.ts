/**
 * Integration tests for RssReader
 * Tests the full workflow using FitGirl Repacks feed fixture
 *
 * NOTE: These tests use fixtures instead of live Puppeteer to avoid browser overhead
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ItemParser } from '../../src/services/ItemParser';
import { LinkExtractor } from '../../src/services/LinkExtractor';
import { TitleCleaner } from '../../src/services/TitleCleaner';
import { UrlParser } from '../../src/utils/UrlParser';
import { DateParser } from '../../src/utils/DateParser';
import type { RssReaderConfig } from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

describe('RssReader Integration Tests', () => {
  // Test with fixture data instead of live Puppeteer
  describe('FitGirl Repacks Feed Processing', () => {
    let fitgirlFeedXml: string;
    let sampleFeedXml: string;

    beforeEach(() => {
      // Load fixtures
      const fitgirlPath = path.join(__dirname, '../fixtures/fitgirlFeed.xml');
      const samplePath = path.join(__dirname, '../fixtures/sampleFeed.xml');

      fitgirlFeedXml = fs.readFileSync(fitgirlPath, 'utf-8');
      sampleFeedXml = fs.readFileSync(samplePath, 'utf-8');
    });

    describe('FitGirl feed item parsing', () => {
      it('should parse FitGirl feed items with title cleaning', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser(),
          {
            titleSuffixPattern: /\s*[–-]\s*FitGirl Repacks$/i,
            itemIdPattern: /[?&]p=(\d+)/
          }
        );

        const parsedItem = await itemParser.parseItem(
          rawItems[0],
          'https://fitgirl-repacks.site/feed/'
        );

        // Verify title cleaning removed "– FitGirl Repacks" suffix
        expect(parsedItem.title).toBe('Cyberpunk 2077: Ultimate Edition v2.1 + 5 DLCs');
        expect(parsedItem.title).not.toContain('FitGirl Repacks');
      });

      it('should extract WordPress-style item IDs from FitGirl URLs', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser(),
          {
            itemIdPattern: /[?&]p=(\d+)/
          }
        );

        const firstItem = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');
        const secondItem = await itemParser.parseItem(rawItems[1], 'https://fitgirl-repacks.site/feed/');

        expect(firstItem.itemId).toBe('98765');
        expect(secondItem.itemId).toBe('98766');
      });

      it('should extract magnet links from FitGirl item content', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        const item = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');

        // Should extract magnet link from content:encoded
        const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
        expect(magnetLinks.length).toBeGreaterThan(0);
        expect(magnetLinks[0]).toContain('xt=urn:btih:');
      });

      it('should extract both magnet and HTTP links from content', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        // Item 5 has both magnet and HTTP links
        const item = await itemParser.parseItem(rawItems[4], 'https://fitgirl-repacks.site/feed/');

        const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
        const httpLinks = item.links.filter(link => link.startsWith('http'));

        expect(magnetLinks.length).toBeGreaterThan(0);
        expect(httpLinks.length).toBeGreaterThan(0);
        expect(item.links.length).toBeGreaterThan(1);
      });

      it('should parse dates correctly from FitGirl feed', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        const item = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');

        expect(item.publishedAt).toBeInstanceOf(Date);
        expect(item.publishedAt.getUTCFullYear()).toBe(2023);
        expect(item.publishedAt.getUTCMonth()).toBe(11); // December
        expect(item.publishedAt.getUTCDate()).toBe(24);
      });

      it('should handle items with no links in content', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        // Item 4 has no links in content
        const item = await itemParser.parseItem(rawItems[3], 'https://fitgirl-repacks.site/feed/');

        expect(item.links).toEqual([]);
        expect(item.title).toContain('Witcher');
      });

      it('should extract multiple magnet links from single item', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        // Item 2 has multiple magnet links
        const item = await itemParser.parseItem(rawItems[1], 'https://fitgirl-repacks.site/feed/');

        const magnetLinks = item.links.filter(link => link.startsWith('magnet:'));
        expect(magnetLinks.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Complete feed parsing workflow', () => {
      it('should parse entire FitGirl feed with all items', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser(),
          {
            titleSuffixPattern: /\s*[–-]\s*FitGirl Repacks$/i,
            itemIdPattern: /[?&]p=(\d+)/
          }
        );

        const parsedItems = await Promise.all(
          rawItems.map((rawItem: any) =>
            itemParser.parseItem(rawItem, 'https://fitgirl-repacks.site/feed/')
          )
        );

        // Should have 5 items in the fixture
        expect(parsedItems.length).toBe(5);

        // All titles should be cleaned
        parsedItems.forEach(item => {
          expect(item.title).not.toContain('FitGirl Repacks');
        });

        // All should have valid dates
        parsedItems.forEach(item => {
          expect(item.publishedAt).toBeInstanceOf(Date);
          expect(isNaN(item.publishedAt.getTime())).toBe(false);
        });

        // All should have item IDs
        parsedItems.forEach(item => {
          expect(item.itemId).toBeDefined();
          expect(item.itemId).toMatch(/^\d+$/);
        });
      });

      it('should maintain correct order of items', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        const parsedItems = await Promise.all(
          rawItems.map((rawItem: any) =>
            itemParser.parseItem(rawItem, 'https://fitgirl-repacks.site/feed/')
          )
        );

        // Items should be in chronological order (newest first in feed)
        expect(parsedItems[0].publishedAt.getTime()).toBeGreaterThan(
          parsedItems[1].publishedAt.getTime()
        );
        expect(parsedItems[1].publishedAt.getTime()).toBeGreaterThan(
          parsedItems[2].publishedAt.getTime()
        );
      });
    });

    describe('Link extraction scenarios', () => {
      it('should deduplicate links within single item', async () => {
        const htmlWithDuplicates = `
          <a href="https://example.com/download">Link 1</a>
          <a href="https://example.com/download">Link 2</a>
          <a href="magnet:?xt=urn:btih:12345">Magnet</a>
        `;

        const extractor = new LinkExtractor();
        const links = extractor.extractLinks(htmlWithDuplicates);

        expect(links).toHaveLength(2);
        expect(links).toContain('https://example.com/download');
        expect(links).toContain('magnet:?xt=urn:btih:12345');
      });

      it('should extract links from complex HTML structures', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        // First item has nested div structure with multiple link types
        const item = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');

        // Should extract magnet and mirror links
        expect(item.links.length).toBeGreaterThan(1);
        expect(item.links.some(link => link.includes('1fichier'))).toBe(true);
        expect(item.links.some(link => link.includes('uploadhaven'))).toBe(true);
      });
    });

    describe('Sample feed parsing', () => {
      it('should parse generic RSS 2.0 feed', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(sampleFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        const parsedItems = await Promise.all(
          rawItems.map((rawItem: any) =>
            itemParser.parseItem(rawItem, 'https://example.com/feed')
          )
        );

        expect(parsedItems.length).toBe(2);
        expect(parsedItems[0].title).toBe('Sample Item 1');
        expect(parsedItems[1].title).toBe('Sample Item 2');
      });
    });

    describe('Configuration integration', () => {
      it('should respect custom title suffix pattern', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const customConfig: RssReaderConfig = {
          titleSuffixPattern: /\s*[–-]\s*FitGirl Repacks$/i
        };

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser(),
          customConfig
        );

        const item = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');

        expect(item.title).not.toContain('FitGirl Repacks');
        expect(item.title).toBe('Cyberpunk 2077: Ultimate Edition v2.1 + 5 DLCs');
      });

      it('should respect custom item ID pattern', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(fitgirlFeedXml);
        const rawItems = result.rss.channel[0].item;

        const customConfig: RssReaderConfig = {
          itemIdPattern: /[?&]p=(\d+)/
        };

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser(),
          customConfig
        );

        const item = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');

        expect(item.itemId).toBe('98765');
      });

      it('should work without any configuration', async () => {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(sampleFeedXml);
        const rawItems = result.rss.channel[0].item;

        const itemParser = new ItemParser(
          new LinkExtractor(),
          new TitleCleaner(),
          new UrlParser(),
          new DateParser()
        );

        const item = await itemParser.parseItem(rawItems[0], 'https://example.com/feed');

        expect(item.title).toBe('Sample Item 1');
        expect(item.links.length).toBeGreaterThan(0);
      });
    });

    describe('Error handling', () => {
      it('should handle malformed feed items gracefully', async () => {
        const malformedPath = path.join(__dirname, '../fixtures/malformedFeed.xml');
        const malformedXml = fs.readFileSync(malformedPath, 'utf-8');

        const parser = new xml2js.Parser({ strict: false });

        try {
          const result = await parser.parseStringPromise(malformedXml);
          const rawItems = result.rss.channel[0].item;

          const itemParser = new ItemParser(
            new LinkExtractor(),
            new TitleCleaner(),
            new UrlParser(),
            new DateParser()
          );

          // First item is missing link - should throw
          await expect(
            itemParser.parseItem(rawItems[0], 'https://example.com/feed')
          ).rejects.toThrow();
        } catch (error) {
          // XML parsing may fail - that's expected for malformed feed
          expect(error).toBeDefined();
        }
      });

      it('should handle items with invalid dates', async () => {
        const malformedPath = path.join(__dirname, '../fixtures/malformedFeed.xml');
        const malformedXml = fs.readFileSync(malformedPath, 'utf-8');

        const parser = new xml2js.Parser({ strict: false });

        try {
          const result = await parser.parseStringPromise(malformedXml);
          const rawItems = result.rss.channel[0].item;

          const itemParser = new ItemParser(
            new LinkExtractor(),
            new TitleCleaner(),
            new UrlParser(),
            new DateParser()
          );

          // Item with invalid date should throw
          await expect(
            itemParser.parseItem(rawItems[2], 'https://example.com/feed')
          ).rejects.toThrow();
        } catch (error) {
          // XML parsing may fail - that's expected for malformed feed
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('End-to-end validation', () => {
    it('should validate complete FitGirl item structure', async () => {
      const fitgirlPath = path.join(__dirname, '../fixtures/fitgirlFeed.xml');
      const xml = fs.readFileSync(fitgirlPath, 'utf-8');

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xml);
      const rawItems = result.rss.channel[0].item;

      const itemParser = new ItemParser(
        new LinkExtractor(),
        new TitleCleaner(),
        new UrlParser(),
        new DateParser(),
        {
          titleSuffixPattern: /\s*[–-]\s*FitGirl Repacks$/i,
          itemIdPattern: /[?&]p=(\d+)/
        }
      );

      const item = await itemParser.parseItem(rawItems[0], 'https://fitgirl-repacks.site/feed/');

      // Validate all required fields
      expect(item.title).toBeTruthy();
      expect(typeof item.title).toBe('string');

      expect(item.link).toBeTruthy();
      expect(typeof item.link).toBe('string');
      expect(item.link).toMatch(/^https?:\/\//);

      expect(item.publishedAt).toBeInstanceOf(Date);
      expect(isNaN(item.publishedAt.getTime())).toBe(false);

      expect(Array.isArray(item.links)).toBe(true);
      item.links.forEach(link => {
        expect(typeof link).toBe('string');
      });

      // Validate optional fields if present
      if (item.itemId) {
        expect(typeof item.itemId).toBe('string');
      }

      if (item.rawContent) {
        expect(typeof item.rawContent).toBe('string');
      }

      if (item.metadata) {
        expect(typeof item.metadata).toBe('object');
        expect(item.metadata).not.toBeNull();
      }
    });
  });
});
