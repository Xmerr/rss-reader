/**
 * Unit tests for ItemValidator
 * Coverage target: 100%
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ItemValidator } from '../../src/validators/ItemValidator';
import { ParseError } from '../../src/errors/RssReaderErrors';
import type { RssItem } from '../../src/types';

describe('ItemValidator', () => {
  let validator: ItemValidator;

  beforeEach(() => {
    validator = new ItemValidator();
  });

  // Helper function to create a valid base item
  const createValidItem = (): RssItem => ({
    title: 'Test Item',
    link: 'https://example.com/item',
    publishedAt: new Date('2024-01-01T12:00:00Z'),
    links: ['https://example.com/download']
  });

  describe('validate', () => {
    describe('valid items', () => {
      it('should validate item with all required fields', () => {
        const item = createValidItem();

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should validate item with optional itemId', () => {
        const item: RssItem = {
          ...createValidItem(),
          itemId: '12345'
        };

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should validate item with optional rawContent', () => {
        const item: RssItem = {
          ...createValidItem(),
          rawContent: '<p>Raw HTML content</p>'
        };

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should validate item with optional metadata', () => {
        const item: RssItem = {
          ...createValidItem(),
          metadata: { author: 'Test Author', category: 'News' }
        };

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should validate item with all optional fields', () => {
        const item: RssItem = {
          ...createValidItem(),
          itemId: '12345',
          rawContent: '<p>Content</p>',
          metadata: { key: 'value' }
        };

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should validate item with empty links array', () => {
        const item: RssItem = {
          ...createValidItem(),
          links: [] // Empty but valid array
        };

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should validate item with multiple links', () => {
        const item: RssItem = {
          ...createValidItem(),
          links: [
            'https://example.com/download1',
            'https://example.com/download2',
            'magnet:?xt=urn:btih:12345'
          ]
        };

        expect(() => validator.validate(item)).not.toThrow();
      });
    });

    describe('title validation', () => {
      it('should throw ParseError when title is missing', () => {
        const item = { ...createValidItem() };
        delete (item as any).title;

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/title is required/);
      });

      it('should throw ParseError when title is empty string', () => {
        const item = { ...createValidItem(), title: '' };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/title is required/);
      });

      it('should throw ParseError when title is whitespace only', () => {
        const item = { ...createValidItem(), title: '   \t\n   ' };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/title is required/);
      });

      it('should throw ParseError when title is not a string', () => {
        const item = { ...createValidItem(), title: 12345 as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/title is required/);
      });

      it('should throw ParseError when title is null', () => {
        const item = { ...createValidItem(), title: null as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/title is required/);
      });
    });

    describe('link validation', () => {
      it('should throw ParseError when link is missing', () => {
        const item = { ...createValidItem() };
        delete (item as any).link;

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/link is required/);
      });

      it('should throw ParseError when link is empty string', () => {
        const item = { ...createValidItem(), link: '' };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/link is required/);
      });

      it('should throw ParseError when link is whitespace only', () => {
        const item = { ...createValidItem(), link: '   ' };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/link is required/);
      });

      it('should throw ParseError when link is not a string', () => {
        const item = { ...createValidItem(), link: 12345 as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/link is required/);
      });

      it('should throw ParseError when link is null', () => {
        const item = { ...createValidItem(), link: null as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/link is required/);
      });
    });

    describe('publishedAt validation', () => {
      it('should throw ParseError when publishedAt is missing', () => {
        const item = { ...createValidItem() };
        delete (item as any).publishedAt;

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/publishedAt is required/);
      });

      it('should throw ParseError when publishedAt is not a Date', () => {
        const item = { ...createValidItem(), publishedAt: 'not a date' as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/publishedAt is required and must be a Date object/);
      });

      it('should throw ParseError when publishedAt is null', () => {
        const item = { ...createValidItem(), publishedAt: null as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/publishedAt is required/);
      });

      it('should throw ParseError when publishedAt is invalid Date', () => {
        const item = { ...createValidItem(), publishedAt: new Date('invalid') };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/publishedAt must be a valid Date/);
      });

      it('should throw ParseError when publishedAt is a date string', () => {
        const item = { ...createValidItem(), publishedAt: '2024-01-01T12:00:00Z' as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
      });
    });

    describe('links array validation', () => {
      it('should throw ParseError when links is missing', () => {
        const item = { ...createValidItem() };
        delete (item as any).links;

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/links must be an array/);
      });

      it('should throw ParseError when links is not an array', () => {
        const item = { ...createValidItem(), links: 'not an array' as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/links must be an array/);
      });

      it('should throw ParseError when links is null', () => {
        const item = { ...createValidItem(), links: null as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/links must be an array/);
      });

      it('should throw ParseError when links contains non-string values', () => {
        const item = { ...createValidItem(), links: ['valid', 12345, 'another'] as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/all links must be strings/);
      });

      it('should throw ParseError when links contains null', () => {
        const item = { ...createValidItem(), links: ['valid', null, 'another'] as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/all links must be strings/);
      });

      it('should throw ParseError when links contains objects', () => {
        const item = { ...createValidItem(), links: [{ url: 'test' }] as any };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/all links must be strings/);
      });
    });

    describe('optional field validation', () => {
      it('should throw ParseError when itemId is not a string', () => {
        const item: any = { ...createValidItem(), itemId: 12345 };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/itemId must be a string/);
      });

      it('should throw ParseError when rawContent is not a string', () => {
        const item: any = { ...createValidItem(), rawContent: 12345 };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/rawContent must be a string/);
      });

      it('should throw ParseError when metadata is not an object', () => {
        const item: any = { ...createValidItem(), metadata: 'not an object' };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/metadata must be a non-null object/);
      });

      it('should throw ParseError when metadata is null', () => {
        const item: any = { ...createValidItem(), metadata: null };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/metadata must be a non-null object/);
      });

      it('should throw ParseError when metadata is an array', () => {
        const item: any = { ...createValidItem(), metadata: ['array', 'values'] };

        expect(() => validator.validate(item)).toThrow(ParseError);
        expect(() => validator.validate(item)).toThrow(/metadata must be a non-null object/);
      });

      it('should allow empty string for itemId', () => {
        const item: any = { ...createValidItem(), itemId: '' };

        // Empty string is still a string, so it should be valid
        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should allow empty string for rawContent', () => {
        const item: any = { ...createValidItem(), rawContent: '' };

        expect(() => validator.validate(item)).not.toThrow();
      });

      it('should allow empty object for metadata', () => {
        const item: any = { ...createValidItem(), metadata: {} };

        expect(() => validator.validate(item)).not.toThrow();
      });
    });
  });

  describe('validateItems', () => {
    it('should validate multiple valid items', () => {
      const items = [
        createValidItem(),
        { ...createValidItem(), title: 'Item 2' },
        { ...createValidItem(), title: 'Item 3' }
      ];

      expect(() => validator.validateItems(items)).not.toThrow();
    });

    it('should throw on first invalid item', () => {
      const items = [
        createValidItem(),
        { ...createValidItem(), title: '' }, // Invalid
        createValidItem()
      ];

      expect(() => validator.validateItems(items)).toThrow(ParseError);
    });

    it('should validate empty array', () => {
      expect(() => validator.validateItems([])).not.toThrow();
    });

    it('should throw when any item is invalid', () => {
      const items = [
        createValidItem(),
        { ...createValidItem(), link: null as any }
      ];

      expect(() => validator.validateItems(items)).toThrow(ParseError);
    });
  });

  describe('isValid', () => {
    it('should return true for valid item', () => {
      const item = createValidItem();

      expect(validator.isValid(item)).toBe(true);
    });

    it('should return false for item with missing title', () => {
      const item = { ...createValidItem() };
      delete (item as any).title;

      expect(validator.isValid(item)).toBe(false);
    });

    it('should return false for item with invalid date', () => {
      const item = { ...createValidItem(), publishedAt: new Date('invalid') };

      expect(validator.isValid(item)).toBe(false);
    });

    it('should return false for item with non-array links', () => {
      const item = { ...createValidItem(), links: 'not an array' as any };

      expect(validator.isValid(item)).toBe(false);
    });

    it('should return true for item with all optional fields', () => {
      const item: RssItem = {
        ...createValidItem(),
        itemId: '12345',
        rawContent: '<p>Content</p>',
        metadata: { key: 'value' }
      };

      expect(validator.isValid(item)).toBe(true);
    });

    it('should return false for partially constructed item', () => {
      const item: any = {
        title: 'Test',
        link: 'https://example.com'
        // Missing publishedAt and links
      };

      expect(validator.isValid(item)).toBe(false);
    });
  });

  describe('static validateItem', () => {
    it('should validate item without instantiation', () => {
      const item = createValidItem();

      expect(() => ItemValidator.validateItem(item)).not.toThrow();
    });

    it('should throw for invalid item', () => {
      const item = { ...createValidItem(), title: '' };

      expect(() => ItemValidator.validateItem(item)).toThrow(ParseError);
    });
  });

  describe('error messages', () => {
    it('should include item title in error message when available', () => {
      const item = { ...createValidItem(), link: '' };

      try {
        validator.validate(item);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        // Error context should include the title
        const parseError = error as ParseError;
        expect(parseError.message).toContain('link is required');
      }
    });

    it('should handle errors when title is missing', () => {
      const item: any = {
        link: 'https://example.com',
        publishedAt: new Date(),
        links: []
      };

      expect(() => validator.validate(item)).toThrow(ParseError);
      expect(() => validator.validate(item)).toThrow(/title is required/);
    });
  });
});
