/**
 * Unit tests for TitleCleaner
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TitleCleaner } from '../../src/services/TitleCleaner';

describe('TitleCleaner', () => {
  let cleaner: TitleCleaner;

  beforeEach(() => {
    cleaner = new TitleCleaner();
  });

  describe('cleanTitle', () => {
    describe('basic functionality', () => {
      it('should return the title unchanged when no options provided', () => {
        const title = 'Sample Title';
        const cleaned = cleaner.cleanTitle(title);

        expect(cleaned).toBe('Sample Title');
      });

      it('should trim leading and trailing whitespace', () => {
        const title = '   Sample Title   ';
        const cleaned = cleaner.cleanTitle(title);

        expect(cleaned).toBe('Sample Title');
      });

      it('should normalize multiple consecutive spaces to single space', () => {
        const title = 'Sample    Title   with     Spaces';
        const cleaned = cleaner.cleanTitle(title);

        expect(cleaned).toBe('Sample Title with Spaces');
      });

      it('should normalize tabs and newlines to single space', () => {
        const title = 'Sample\tTitle\nwith\r\nWhitespace';
        const cleaned = cleaner.cleanTitle(title);

        expect(cleaned).toBe('Sample Title with Whitespace');
      });

      it('should return empty string for empty input', () => {
        const cleaned = cleaner.cleanTitle('');

        expect(cleaned).toBe('');
      });

      it('should return empty string for whitespace-only input', () => {
        const cleaned = cleaner.cleanTitle('   \t\n   ');

        expect(cleaned).toBe('');
      });

      it('should return empty string for null input', () => {
        const cleaned = cleaner.cleanTitle(null as any);

        expect(cleaned).toBe('');
      });

      it('should return empty string for non-string input', () => {
        const cleaned = cleaner.cleanTitle(12345 as any);

        expect(cleaned).toBe('');
      });
    });

    describe('suffix pattern removal', () => {
      it('should remove suffix matching the pattern', () => {
        const title = 'Game Title – FitGirl Repacks';
        const options = { suffixPattern: /\s*[–-]\s*FitGirl Repacks$/i };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should handle en dash (U+2013) in suffix pattern', () => {
        const title = 'Game Title – FitGirl Repacks';
        const options = { suffixPattern: /\s*–\s*FitGirl Repacks$/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should handle hyphen in suffix pattern', () => {
        const title = 'Game Title - FitGirl Repacks';
        const options = { suffixPattern: /\s*-\s*FitGirl Repacks$/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should be case insensitive when pattern is case insensitive', () => {
        const title = 'Game Title – fitgirl repacks';
        const options = { suffixPattern: /\s*[–-]\s*FitGirl Repacks$/i };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should not remove suffix if pattern does not match', () => {
        const title = 'Game Title – Something Else';
        const options = { suffixPattern: /\s*[–-]\s*FitGirl Repacks$/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title – Something Else');
      });

      it('should handle multiple possible suffix formats', () => {
        const title = 'Game Title | Brand Name';
        const options = { suffixPattern: /\s*[|–-]\s*Brand Name$/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should handle invalid regex gracefully', () => {
        const title = 'Game Title';
        // Create an invalid regex pattern by using a property descriptor
        const invalidPattern = /valid/;
        Object.defineProperty(invalidPattern, 'exec', {
          value: () => {
            throw new Error('Invalid regex');
          }
        });

        const options = { suffixPattern: invalidPattern };
        const cleaned = cleaner.cleanTitle(title, options);

        // Should return the normalized title without crashing
        expect(cleaned).toBe('Game Title');
      });
    });

    describe('prefix pattern removal', () => {
      it('should remove prefix matching the pattern', () => {
        const title = '[RELEASE] Game Title';
        const options = { prefixPattern: /^\[RELEASE\]\s*/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should handle multiple prefix formats', () => {
        const title = 'NEW: Game Title';
        const options = { prefixPattern: /^(NEW|UPDATED):\s*/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should be case insensitive when pattern is case insensitive', () => {
        const title = 'new: Game Title';
        const options = { prefixPattern: /^NEW:\s*/i };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should not remove prefix if pattern does not match', () => {
        const title = '[OTHER] Game Title';
        const options = { prefixPattern: /^\[RELEASE\]\s*/ };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('[OTHER] Game Title');
      });

      it('should handle invalid regex gracefully', () => {
        const title = 'Game Title';
        const invalidPattern = /valid/;
        Object.defineProperty(invalidPattern, 'exec', {
          value: () => {
            throw new Error('Invalid regex');
          }
        });

        const options = { prefixPattern: invalidPattern };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });
    });

    describe('combined prefix and suffix removal', () => {
      it('should remove both prefix and suffix', () => {
        const title = '[NEW] Game Title – FitGirl Repacks';
        const options = {
          prefixPattern: /^\[NEW\]\s*/,
          suffixPattern: /\s*–\s*FitGirl Repacks$/
        };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should normalize whitespace after removing prefix and suffix', () => {
        const title = '[NEW]    Game   Title    – Brand';
        const options = {
          prefixPattern: /^\[NEW\]\s*/,
          suffixPattern: /\s*–\s*Brand$/
        };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Game Title');
      });

      it('should apply prefix removal before suffix removal', () => {
        const title = 'PREFIX Middle SUFFIX';
        const options = {
          prefixPattern: /^PREFIX\s*/,
          suffixPattern: /\s*SUFFIX$/
        };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Middle');
      });
    });

    describe('real-world FitGirl scenarios', () => {
      it('should clean FitGirl repack title with en dash', () => {
        const title = 'Cyberpunk 2077: Ultimate Edition v2.1 + 5 DLCs – FitGirl Repacks';
        const options = { suffixPattern: /\s*[–-]\s*FitGirl Repacks$/i };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Cyberpunk 2077: Ultimate Edition v2.1 + 5 DLCs');
      });

      it('should clean FitGirl repack title with hyphen', () => {
        const title = 'Baldur\'s Gate 3 Deluxe Edition - FitGirl Repacks';
        const options = { suffixPattern: /\s*[–-]\s*FitGirl Repacks$/i };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Baldur\'s Gate 3 Deluxe Edition');
      });

      it('should handle titles with version numbers and special characters', () => {
        const title = 'Red Dead Redemption 2: Ultimate Edition v1436.31 + All DLCs – FitGirl Repacks';
        const options = { suffixPattern: /\s*[–-]\s*FitGirl Repacks$/i };
        const cleaned = cleaner.cleanTitle(title, options);

        expect(cleaned).toBe('Red Dead Redemption 2: Ultimate Edition v1436.31 + All DLCs');
      });
    });
  });

  describe('cleanTitles', () => {
    it('should clean multiple titles with the same options', () => {
      const titles = [
        'Game 1 – FitGirl Repacks',
        'Game 2 – FitGirl Repacks',
        'Game 3 – FitGirl Repacks'
      ];
      const options = { suffixPattern: /\s*–\s*FitGirl Repacks$/ };
      const cleaned = cleaner.cleanTitles(titles, options);

      expect(cleaned).toEqual(['Game 1', 'Game 2', 'Game 3']);
    });

    it('should handle empty array', () => {
      const cleaned = cleaner.cleanTitles([]);

      expect(cleaned).toEqual([]);
    });

    it('should clean each title independently', () => {
      const titles = [
        'Game 1 – FitGirl Repacks',
        'Game 2 – Other Source',
        '   Game 3   '
      ];
      const options = { suffixPattern: /\s*–\s*FitGirl Repacks$/ };
      const cleaned = cleaner.cleanTitles(titles, options);

      expect(cleaned).toEqual([
        'Game 1',
        'Game 2 – Other Source',
        'Game 3'
      ]);
    });
  });

  describe('static clean', () => {
    it('should clean title without instantiation', () => {
      const title = 'Game Title – FitGirl Repacks';
      const options = { suffixPattern: /\s*–\s*FitGirl Repacks$/ };
      const cleaned = TitleCleaner.clean(title, options);

      expect(cleaned).toBe('Game Title');
    });

    it('should normalize whitespace without options', () => {
      const title = '   Game   Title   ';
      const cleaned = TitleCleaner.clean(title);

      expect(cleaned).toBe('Game Title');
    });
  });

  describe('static removeBranding', () => {
    it('should remove branding with en dash', () => {
      const title = 'Game Title – FitGirl Repacks';
      const cleaned = TitleCleaner.removeBranding(title, 'FitGirl Repacks');

      expect(cleaned).toBe('Game Title');
    });

    it('should remove branding with hyphen', () => {
      const title = 'Game Title - FitGirl Repacks';
      const cleaned = TitleCleaner.removeBranding(title, 'FitGirl Repacks');

      expect(cleaned).toBe('Game Title');
    });

    it('should remove branding with vertical bar', () => {
      const title = 'Game Title | FitGirl Repacks';
      const cleaned = TitleCleaner.removeBranding(title, 'FitGirl Repacks');

      expect(cleaned).toBe('Game Title');
    });

    it('should be case insensitive', () => {
      const title = 'Game Title – fitgirl repacks';
      const cleaned = TitleCleaner.removeBranding(title, 'FitGirl Repacks');

      expect(cleaned).toBe('Game Title');
    });

    it('should handle branding with special regex characters', () => {
      const title = 'Game Title – Brand (Official)';
      const cleaned = TitleCleaner.removeBranding(title, 'Brand (Official)');

      expect(cleaned).toBe('Game Title');
    });

    it('should handle branding with dots and brackets', () => {
      const title = 'Game Title – [Brand.Name]';
      const cleaned = TitleCleaner.removeBranding(title, '[Brand.Name]');

      expect(cleaned).toBe('Game Title');
    });

    it('should not remove branding from middle of title', () => {
      const title = 'Game FitGirl Repacks Title';
      const cleaned = TitleCleaner.removeBranding(title, 'FitGirl Repacks');

      // Should not match because branding is in the middle
      expect(cleaned).toBe('Game FitGirl Repacks Title');
    });

    it('should handle whitespace variations around separator', () => {
      const title = 'Game Title   –   FitGirl Repacks';
      const cleaned = TitleCleaner.removeBranding(title, 'FitGirl Repacks');

      expect(cleaned).toBe('Game Title');
    });
  });
});
