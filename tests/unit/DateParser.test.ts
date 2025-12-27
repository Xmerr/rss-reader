/**
 * Unit tests for DateParser
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DateParser } from '../../src/utils/DateParser';

describe('DateParser', () => {
  let parser: DateParser;

  beforeEach(() => {
    parser = new DateParser();
  });

  describe('parseDate', () => {
    describe('RFC 822 format (standard RSS)', () => {
      it('should parse RFC 822 date string', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 +0000';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
        expect(date?.getUTCMonth()).toBe(0); // January (0-indexed)
        expect(date?.getUTCDate()).toBe(1);
      });

      it('should parse RFC 822 date with GMT timezone', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 GMT';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should parse RFC 822 date with positive timezone offset', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 +0500';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should parse RFC 822 date with negative timezone offset', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 -0500';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should parse various month names', () => {
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        months.forEach((month, index) => {
          const dateString = `Mon, 01 ${month} 2024 12:00:00 GMT`;
          const date = parser.parseDate(dateString);

          expect(date).toBeInstanceOf(Date);
          expect(date?.getUTCMonth()).toBe(index);
        });
      });
    });

    describe('RFC 2822 format', () => {
      it('should parse RFC 2822 date string', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 GMT';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should parse RFC 2822 date with named timezone', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 EST';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
      });
    });

    describe('ISO 8601 format', () => {
      it('should parse ISO 8601 date string with Z timezone', () => {
        const dateString = '2024-01-01T12:00:00Z';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
        expect(date?.getUTCMonth()).toBe(0);
        expect(date?.getUTCDate()).toBe(1);
      });

      it('should parse ISO 8601 date with timezone offset', () => {
        const dateString = '2024-01-01T12:00:00+05:00';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should parse ISO 8601 date without timezone', () => {
        const dateString = '2024-01-01T12:00:00';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should parse ISO 8601 date-only format', () => {
        const dateString = '2024-01-01';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });
    });

    describe('real-world RSS date formats', () => {
      it('should parse FitGirl Repacks feed date format', () => {
        const dateString = 'Sun, 24 Dec 2023 18:00:00 +0000';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2023);
        expect(date?.getUTCMonth()).toBe(11); // December
        expect(date?.getUTCDate()).toBe(24);
        expect(date?.getUTCHours()).toBe(18);
      });

      it('should parse date with seconds precision', () => {
        const dateString = 'Mon, 01 Jan 2024 12:34:56 GMT';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCHours()).toBe(12);
        expect(date?.getUTCMinutes()).toBe(34);
        expect(date?.getUTCSeconds()).toBe(56);
      });

      it('should parse date from sample feed fixture', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 +0000';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.toISOString()).toBe('2024-01-01T12:00:00.000Z');
      });
    });

    describe('edge cases and error handling', () => {
      it('should return undefined for invalid date string', () => {
        const dateString = 'not a valid date';
        const date = parser.parseDate(dateString);

        expect(date).toBeUndefined();
      });

      it('should return undefined for empty string', () => {
        const date = parser.parseDate('');

        expect(date).toBeUndefined();
      });

      it('should return undefined for whitespace-only string', () => {
        const date = parser.parseDate('   \t\n   ');

        expect(date).toBeUndefined();
      });

      it('should return undefined for null input', () => {
        const date = parser.parseDate(null as any);

        expect(date).toBeUndefined();
      });

      it('should return undefined for undefined input', () => {
        const date = parser.parseDate(undefined as any);

        expect(date).toBeUndefined();
      });

      it('should return undefined for non-string input', () => {
        const date = parser.parseDate(12345 as any);

        expect(date).toBeUndefined();
      });

      it('should handle date string with leading/trailing whitespace', () => {
        const dateString = '   Mon, 01 Jan 2024 12:00:00 GMT   ';
        const date = parser.parseDate(dateString);

        expect(date).toBeInstanceOf(Date);
        expect(date?.getUTCFullYear()).toBe(2024);
      });

      it('should return undefined for malformed RFC 822 date', () => {
        const dateString = 'Mon, 32 Jan 2024 12:00:00 GMT'; // Invalid day
        const date = parser.parseDate(dateString);

        expect(date).toBeUndefined();
      });

      it('should return undefined for invalid month name', () => {
        const dateString = 'Mon, 01 Foo 2024 12:00:00 GMT';
        const date = parser.parseDate(dateString);

        expect(date).toBeUndefined();
      });
    });

    describe('timezone handling', () => {
      it('should correctly handle UTC offset +0000', () => {
        const dateString = 'Mon, 01 Jan 2024 12:00:00 +0000';
        const date = parser.parseDate(dateString);

        expect(date?.getTime()).toBe(new Date('2024-01-01T12:00:00Z').getTime());
      });

      it('should correctly handle different timezones', () => {
        const utcDate = 'Mon, 01 Jan 2024 12:00:00 +0000';
        const utcParsed = parser.parseDate(utcDate);

        expect(utcParsed).toBeInstanceOf(Date);
        expect(utcParsed?.getUTCHours()).toBe(12);
      });
    });
  });

  describe('parseDateWithFallback', () => {
    it('should parse valid date string', () => {
      const dateString = 'Mon, 01 Jan 2024 12:00:00 GMT';
      const date = parser.parseDateWithFallback(dateString);

      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2024);
    });

    it('should return current date for invalid date string', () => {
      const before = new Date();
      const date = parser.parseDateWithFallback('invalid date');
      const after = new Date();

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(date.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return current date for empty string', () => {
      const before = new Date();
      const date = parser.parseDateWithFallback('');
      const after = new Date();

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(date.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('static parse', () => {
    it('should parse date without instantiation', () => {
      const dateString = 'Mon, 01 Jan 2024 12:00:00 GMT';
      const date = DateParser.parse(dateString);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getUTCFullYear()).toBe(2024);
    });

    it('should return undefined for invalid date', () => {
      const date = DateParser.parse('invalid');

      expect(date).toBeUndefined();
    });
  });

  describe('static isValidDate', () => {
    it('should return true for valid RFC 822 date', () => {
      const dateString = 'Mon, 01 Jan 2024 12:00:00 GMT';
      const isValid = DateParser.isValidDate(dateString);

      expect(isValid).toBe(true);
    });

    it('should return true for valid ISO 8601 date', () => {
      const dateString = '2024-01-01T12:00:00Z';
      const isValid = DateParser.isValidDate(dateString);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid date string', () => {
      const isValid = DateParser.isValidDate('not a date');

      expect(isValid).toBe(false);
    });

    it('should return false for empty string', () => {
      const isValid = DateParser.isValidDate('');

      expect(isValid).toBe(false);
    });

    it('should return false for malformed date', () => {
      const isValid = DateParser.isValidDate('Mon, 32 Jan 2024 12:00:00 GMT');

      expect(isValid).toBe(false);
    });
  });

  describe('date comparison and consistency', () => {
    it('should parse the same date string consistently', () => {
      const dateString = 'Mon, 01 Jan 2024 12:00:00 GMT';
      const date1 = parser.parseDate(dateString);
      const date2 = parser.parseDate(dateString);

      expect(date1?.getTime()).toBe(date2?.getTime());
    });

    it('should correctly order dates', () => {
      const earlier = parser.parseDate('Mon, 01 Jan 2024 12:00:00 GMT');
      const later = parser.parseDate('Tue, 02 Jan 2024 12:00:00 GMT');

      expect(earlier!.getTime()).toBeLessThan(later!.getTime());
    });

    it('should handle dates across year boundaries', () => {
      const endOf2023 = parser.parseDate('Sun, 31 Dec 2023 23:59:59 GMT');
      const startOf2024 = parser.parseDate('Mon, 01 Jan 2024 00:00:00 GMT');

      expect(endOf2023!.getTime()).toBeLessThan(startOf2024!.getTime());
      expect(endOf2023?.getUTCFullYear()).toBe(2023);
      expect(startOf2024?.getUTCFullYear()).toBe(2024);
    });
  });
});
