/**
 * Unit tests for LinkValidator
 * Coverage target: 100%
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LinkValidator } from '../../src/validators/LinkValidator';

describe('LinkValidator', () => {
  let validator: LinkValidator;

  beforeEach(() => {
    validator = new LinkValidator();
  });

  describe('validateLink', () => {
    describe('default pattern (HTTP/HTTPS/magnet)', () => {
      it('should validate HTTP link', () => {
        const link = 'http://example.com';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should validate HTTPS link', () => {
        const link = 'https://example.com';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should validate HTTPS link with path', () => {
        const link = 'https://example.com/path/to/resource';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should validate HTTPS link with query parameters', () => {
        const link = 'https://example.com/page?param=value';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should validate magnet link', () => {
        const link = 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should validate magnet link with trackers', () => {
        const link = 'magnet:?xt=urn:btih:12345&tr=udp://tracker.example.com:1337/announce';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should be case insensitive for HTTP protocol', () => {
        expect(validator.validateLink('HTTP://example.com')).toBe(true);
        expect(validator.validateLink('HTTPS://example.com')).toBe(true);
        expect(validator.validateLink('Https://example.com')).toBe(true);
      });

      it('should be case insensitive for magnet protocol', () => {
        expect(validator.validateLink('Magnet:?xt=urn:btih:12345')).toBe(true);
        expect(validator.validateLink('MAGNET:?xt=urn:btih:12345')).toBe(true);
      });

      it('should reject FTP link (not in default pattern)', () => {
        const link = 'ftp://example.com';

        expect(validator.validateLink(link)).toBe(false);
      });

      it('should reject mailto link', () => {
        const link = 'mailto:test@example.com';

        expect(validator.validateLink(link)).toBe(false);
      });

      it('should reject tel link', () => {
        const link = 'tel:+1234567890';

        expect(validator.validateLink(link)).toBe(false);
      });

      it('should reject relative URL', () => {
        const link = '/relative/path';

        expect(validator.validateLink(link)).toBe(false);
      });

      it('should reject anchor link', () => {
        const link = '#anchor';

        expect(validator.validateLink(link)).toBe(false);
      });

      it('should reject javascript: link', () => {
        const link = 'javascript:void(0)';

        expect(validator.validateLink(link)).toBe(false);
      });
    });

    describe('custom patterns', () => {
      it('should validate link with custom HTTPS-only pattern', () => {
        const link = 'https://example.com';
        const pattern = /^https:\/\//;

        expect(validator.validateLink(link, pattern)).toBe(true);
      });

      it('should reject HTTP link with HTTPS-only pattern', () => {
        const link = 'http://example.com';
        const pattern = /^https:\/\//;

        expect(validator.validateLink(link, pattern)).toBe(false);
      });

      it('should validate link with custom domain pattern', () => {
        const link = 'https://example.com/download';
        const pattern = /^https:\/\/example\.com/;

        expect(validator.validateLink(link, pattern)).toBe(true);
      });

      it('should reject link with different domain', () => {
        const link = 'https://other.com/download';
        const pattern = /^https:\/\/example\.com/;

        expect(validator.validateLink(link, pattern)).toBe(false);
      });

      it('should validate link with magnet-only pattern', () => {
        const link = 'magnet:?xt=urn:btih:12345';
        const pattern = /^magnet:/;

        expect(validator.validateLink(link, pattern)).toBe(true);
      });

      it('should validate link with complex custom pattern', () => {
        const link = 'https://example.com/api/v1/resource/12345';
        const pattern = /^https:\/\/example\.com\/api\/v\d+\/resource\/\d+$/;

        expect(validator.validateLink(link, pattern)).toBe(true);
      });
    });

    describe('edge cases and error handling', () => {
      it('should return false for empty string', () => {
        expect(validator.validateLink('')).toBe(false);
      });

      it('should return false for whitespace only', () => {
        expect(validator.validateLink('   ')).toBe(false);
      });

      it('should return false for null', () => {
        expect(validator.validateLink(null as any)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(validator.validateLink(undefined as any)).toBe(false);
      });

      it('should return false for non-string input', () => {
        expect(validator.validateLink(12345 as any)).toBe(false);
      });

      it('should trim whitespace before validation', () => {
        const link = '  https://example.com  ';

        expect(validator.validateLink(link)).toBe(true);
      });

      it('should handle invalid regex gracefully', () => {
        const link = 'https://example.com';
        const invalidPattern = /valid/;
        Object.defineProperty(invalidPattern, 'test', {
          value: () => {
            throw new Error('Invalid regex');
          }
        });

        expect(validator.validateLink(link, invalidPattern)).toBe(false);
      });
    });

    describe('real-world FitGirl links', () => {
      it('should validate FitGirl magnet links', () => {
        const magnetLinks = [
          'magnet:?xt=urn:btih:a1b2c3d4e5f6789012345678901234567890abcd&dn=Cyberpunk.2077.Ultimate.Edition.FitGirl.Repack&tr=udp://tracker.opentrackr.org:1337/announce',
          'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678&dn=Baldurs.Gate.3.Deluxe.FitGirl.Repack&tr=udp://tracker.coppersurfer.tk:6969/announce'
        ];

        magnetLinks.forEach(link => {
          expect(validator.validateLink(link)).toBe(true);
        });
      });

      it('should validate FitGirl HTTP download links', () => {
        const httpLinks = [
          'https://rapidgator.net/file/rdr2-ultimate',
          'https://uploaded.net/file/rdr2-ultimate',
          'https://1fichier.com/download/cyberpunk2077'
        ];

        httpLinks.forEach(link => {
          expect(validator.validateLink(link)).toBe(true);
        });
      });
    });
  });

  describe('validateLinks', () => {
    it('should validate array of links', () => {
      const links = [
        'https://example.com/1',
        'https://example.com/2',
        'magnet:?xt=urn:btih:12345'
      ];

      const results = validator.validateLinks(links);

      expect(results).toEqual([true, true, true]);
    });

    it('should return mixed results for valid and invalid links', () => {
      const links = [
        'https://example.com',
        'ftp://example.com',
        'magnet:?xt=urn:btih:12345',
        '/relative/path'
      ];

      const results = validator.validateLinks(links);

      expect(results).toEqual([true, false, true, false]);
    });

    it('should handle empty array', () => {
      const results = validator.validateLinks([]);

      expect(results).toEqual([]);
    });

    it('should use custom pattern for all links', () => {
      const links = [
        'https://example.com/1',
        'http://example.com/2',
        'https://example.com/3'
      ];
      const pattern = /^https:\/\//; // Only HTTPS

      const results = validator.validateLinks(links, pattern);

      expect(results).toEqual([true, false, true]);
    });
  });

  describe('filterValidLinks', () => {
    it('should filter and return only valid links', () => {
      const links = [
        'https://example.com/1',
        'ftp://example.com',
        'magnet:?xt=urn:btih:12345',
        '/relative/path',
        'https://example.com/2'
      ];

      const validLinks = validator.filterValidLinks(links);

      expect(validLinks).toEqual([
        'https://example.com/1',
        'magnet:?xt=urn:btih:12345',
        'https://example.com/2'
      ]);
    });

    it('should return empty array when no valid links', () => {
      const links = [
        'ftp://example.com',
        '/relative/path',
        '#anchor'
      ];

      const validLinks = validator.filterValidLinks(links);

      expect(validLinks).toEqual([]);
    });

    it('should return all links when all are valid', () => {
      const links = [
        'https://example.com/1',
        'https://example.com/2',
        'magnet:?xt=urn:btih:12345'
      ];

      const validLinks = validator.filterValidLinks(links);

      expect(validLinks).toEqual(links);
    });

    it('should filter with custom pattern', () => {
      const links = [
        'https://example.com/1',
        'http://example.com/2',
        'https://example.com/3'
      ];
      const pattern = /^https:\/\//; // Only HTTPS

      const validLinks = validator.filterValidLinks(links, pattern);

      expect(validLinks).toEqual([
        'https://example.com/1',
        'https://example.com/3'
      ]);
    });

    it('should handle empty array', () => {
      const validLinks = validator.filterValidLinks([]);

      expect(validLinks).toEqual([]);
    });
  });

  describe('static isValid', () => {
    it('should validate link without instantiation', () => {
      expect(LinkValidator.isValid('https://example.com')).toBe(true);
      expect(LinkValidator.isValid('ftp://example.com')).toBe(false);
    });

    it('should work with custom pattern', () => {
      const link = 'https://example.com';
      const pattern = /^https:\/\//;

      expect(LinkValidator.isValid(link, pattern)).toBe(true);
    });

    it('should reject invalid link', () => {
      expect(LinkValidator.isValid('/relative/path')).toBe(false);
    });
  });

  describe('static isHttpLink', () => {
    it('should return true for HTTP link', () => {
      expect(LinkValidator.isHttpLink('http://example.com')).toBe(true);
    });

    it('should return true for HTTPS link', () => {
      expect(LinkValidator.isHttpLink('https://example.com')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(LinkValidator.isHttpLink('HTTP://example.com')).toBe(true);
      expect(LinkValidator.isHttpLink('HTTPS://example.com')).toBe(true);
    });

    it('should return false for magnet link', () => {
      expect(LinkValidator.isHttpLink('magnet:?xt=urn:btih:12345')).toBe(false);
    });

    it('should return false for FTP link', () => {
      expect(LinkValidator.isHttpLink('ftp://example.com')).toBe(false);
    });

    it('should return false for relative URL', () => {
      expect(LinkValidator.isHttpLink('/relative/path')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(LinkValidator.isHttpLink('')).toBe(false);
    });
  });

  describe('static isMagnetLink', () => {
    it('should return true for magnet link', () => {
      expect(LinkValidator.isMagnetLink('magnet:?xt=urn:btih:12345')).toBe(true);
    });

    it('should return true for magnet link with trackers', () => {
      const link = 'magnet:?xt=urn:btih:12345&tr=udp://tracker.example.com:1337/announce';
      expect(LinkValidator.isMagnetLink(link)).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(LinkValidator.isMagnetLink('Magnet:?xt=urn:btih:12345')).toBe(true);
      expect(LinkValidator.isMagnetLink('MAGNET:?xt=urn:btih:12345')).toBe(true);
    });

    it('should return false for HTTP link', () => {
      expect(LinkValidator.isMagnetLink('https://example.com')).toBe(false);
    });

    it('should return false for FTP link', () => {
      expect(LinkValidator.isMagnetLink('ftp://example.com')).toBe(false);
    });

    it('should return false for relative URL', () => {
      expect(LinkValidator.isMagnetLink('/relative/path')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(LinkValidator.isMagnetLink('')).toBe(false);
    });
  });

  describe('comprehensive link type categorization', () => {
    it('should correctly categorize various link types', () => {
      const testCases = [
        { link: 'https://example.com', isHttp: true, isMagnet: false },
        { link: 'http://example.com', isHttp: true, isMagnet: false },
        { link: 'magnet:?xt=urn:btih:12345', isHttp: false, isMagnet: true },
        { link: 'ftp://example.com', isHttp: false, isMagnet: false },
        { link: '/relative', isHttp: false, isMagnet: false }
      ];

      testCases.forEach(({ link, isHttp, isMagnet }) => {
        expect(LinkValidator.isHttpLink(link)).toBe(isHttp);
        expect(LinkValidator.isMagnetLink(link)).toBe(isMagnet);
      });
    });
  });
});
