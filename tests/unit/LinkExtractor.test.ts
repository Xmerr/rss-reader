/**
 * Unit tests for LinkExtractor
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LinkExtractor } from '../../src/services/LinkExtractor';
import * as fs from 'fs';
import * as path from 'path';

describe('LinkExtractor', () => {
  let extractor: LinkExtractor;

  beforeEach(() => {
    extractor = new LinkExtractor();
  });

  describe('extractLinks', () => {
    it('should extract HTTP links from HTML', () => {
      const html = `
        <p>Download here:</p>
        <a href="https://example.com/download">Download</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toEqual(['https://example.com/download']);
    });

    it('should extract HTTP (non-secure) links from HTML', () => {
      const html = `
        <p>Old link:</p>
        <a href="http://example.com/download">Download</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toEqual(['http://example.com/download']);
    });

    it('should extract magnet links from HTML', () => {
      const html = `
        <p>Torrent:</p>
        <a href="magnet:?xt=urn:btih:12345">Magnet</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toEqual(['magnet:?xt=urn:btih:12345']);
    });

    it('should extract multiple links', () => {
      const html = `
        <a href="https://example.com/1">Link 1</a>
        <a href="https://example.com/2">Link 2</a>
        <a href="magnet:?xt=urn:btih:12345">Magnet</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toHaveLength(3);
      expect(links).toContain('https://example.com/1');
      expect(links).toContain('https://example.com/2');
      expect(links).toContain('magnet:?xt=urn:btih:12345');
    });

    it('should remove duplicate links while preserving order', () => {
      const html = `
        <a href="https://example.com/download">Link 1</a>
        <a href="https://example.com/other">Different</a>
        <a href="https://example.com/download">Link 2 (duplicate)</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toEqual(['https://example.com/download', 'https://example.com/other']);
    });

    it('should return empty array for HTML without links', () => {
      const html = '<p>No links here</p>';

      const links = extractor.extractLinks(html);

      expect(links).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const links = extractor.extractLinks('');

      expect(links).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const links = extractor.extractLinks(null as any);

      expect(links).toEqual([]);
    });

    it('should return empty array for non-string input', () => {
      const links = extractor.extractLinks(12345 as any);

      expect(links).toEqual([]);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<a href="test">Link</a><p>Unclosed tag';

      const links = extractor.extractLinks(html);

      expect(links).toContain('test');
    });

    it('should ignore anchors without href', () => {
      const html = `
        <a>No href</a>
        <a href="">Empty href</a>
        <a href="https://example.com">Valid</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toEqual(['https://example.com']);
    });

    it('should trim whitespace from href values', () => {
      const html = `
        <a href="  https://example.com/trimmed  ">Link with whitespace</a>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toEqual(['https://example.com/trimmed']);
    });

    it('should handle nested HTML structures', () => {
      const html = `
        <div>
          <ul>
            <li><a href="https://example.com/1">Link 1</a></li>
            <li><a href="https://example.com/2">Link 2</a></li>
          </ul>
          <div>
            <p>Text with <a href="https://example.com/3">inline link</a></p>
          </div>
        </div>
      `;

      const links = extractor.extractLinks(html);

      expect(links).toHaveLength(3);
      expect(links).toContain('https://example.com/1');
      expect(links).toContain('https://example.com/2');
      expect(links).toContain('https://example.com/3');
    });

    it('should extract all link types from fixture file', () => {
      const fixturePath = path.join(__dirname, '../fixtures/sampleItem.html');
      const html = fs.readFileSync(fixturePath, 'utf-8');

      const links = extractor.extractLinks(html);

      // Should contain various link types
      expect(links.length).toBeGreaterThan(0);
      expect(links).toContain('http://example.com/page1');
      expect(links).toContain('https://example.com/page2');
      expect(links).toContain('magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678&dn=Sample.File&tr=udp://tracker.example.com:1337/announce');
    });

    it('should return empty array for content without links', () => {
      const fixturePath = path.join(__dirname, '../fixtures/noLinksItem.html');
      const html = fs.readFileSync(fixturePath, 'utf-8');

      const links = extractor.extractLinks(html);

      expect(links).toEqual([]);
    });
  });

  describe('extractLinksByType', () => {
    it('should categorize links by type', () => {
      const html = `
        <a href="https://example.com/1">HTTPS</a>
        <a href="http://example.com/2">HTTP</a>
        <a href="magnet:?xt=urn:btih:12345">Magnet</a>
        <a href="ftp://example.com">FTP</a>
      `;

      const categorized = extractor.extractLinksByType(html);

      expect(categorized.http).toHaveLength(2);
      expect(categorized.http).toContain('https://example.com/1');
      expect(categorized.http).toContain('http://example.com/2');
      expect(categorized.magnet).toEqual(['magnet:?xt=urn:btih:12345']);
      expect(categorized.other).toEqual(['ftp://example.com']);
    });

    it('should return empty arrays when no links found', () => {
      const html = '<p>No links here</p>';

      const categorized = extractor.extractLinksByType(html);

      expect(categorized.http).toEqual([]);
      expect(categorized.magnet).toEqual([]);
      expect(categorized.other).toEqual([]);
    });

    it('should handle mixed case protocols', () => {
      const html = `
        <a href="HTTPS://example.com/upper">Upper HTTPS</a>
        <a href="Magnet:?xt=urn:btih:12345">Mixed Magnet</a>
      `;

      const categorized = extractor.extractLinksByType(html);

      expect(categorized.http).toContain('HTTPS://example.com/upper');
      expect(categorized.magnet).toContain('Magnet:?xt=urn:btih:12345');
    });
  });

  describe('extractHttpLinks', () => {
    it('should extract only HTTP/HTTPS links', () => {
      const html = `
        <a href="https://example.com/1">HTTPS</a>
        <a href="http://example.com/2">HTTP</a>
        <a href="magnet:?xt=urn:btih:12345">Magnet</a>
        <a href="ftp://example.com">FTP</a>
      `;

      const httpLinks = extractor.extractHttpLinks(html);

      expect(httpLinks).toHaveLength(2);
      expect(httpLinks).toContain('https://example.com/1');
      expect(httpLinks).toContain('http://example.com/2');
      expect(httpLinks).not.toContain('magnet:?xt=urn:btih:12345');
    });

    it('should return empty array when no HTTP links found', () => {
      const html = '<a href="magnet:?xt=urn:btih:12345">Magnet</a>';

      const httpLinks = extractor.extractHttpLinks(html);

      expect(httpLinks).toEqual([]);
    });
  });

  describe('extractMagnetLinks', () => {
    it('should extract only magnet links', () => {
      const html = `
        <a href="https://example.com/1">HTTPS</a>
        <a href="magnet:?xt=urn:btih:12345">Magnet 1</a>
        <a href="magnet:?xt=urn:btih:67890">Magnet 2</a>
      `;

      const magnetLinks = extractor.extractMagnetLinks(html);

      expect(magnetLinks).toHaveLength(2);
      expect(magnetLinks).toContain('magnet:?xt=urn:btih:12345');
      expect(magnetLinks).toContain('magnet:?xt=urn:btih:67890');
      expect(magnetLinks).not.toContain('https://example.com/1');
    });

    it('should return empty array when no magnet links found', () => {
      const html = '<a href="https://example.com">HTTP</a>';

      const magnetLinks = extractor.extractMagnetLinks(html);

      expect(magnetLinks).toEqual([]);
    });
  });

  describe('static extract', () => {
    it('should extract links without instantiation', () => {
      const html = '<a href="https://example.com">Link</a>';
      const links = LinkExtractor.extract(html);

      expect(links).toEqual(['https://example.com']);
    });

    it('should work with complex HTML', () => {
      const html = `
        <a href="https://example.com/1">Link 1</a>
        <a href="magnet:?xt=urn:btih:12345">Magnet</a>
      `;
      const links = LinkExtractor.extract(html);

      expect(links).toHaveLength(2);
    });
  });
});
