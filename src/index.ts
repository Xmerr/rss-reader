/**
 * @xmer/rss-reader - RSS feed reader with Puppeteer-based scraping
 *
 * A standalone npm package that provides a generic TypeScript RSS feed reader
 * with Puppeteer-based scraping for JavaScript-rendered content.
 *
 * @packageDocumentation
 */

// Main class
export { RssReader } from './reader/RssReader';

// Types
export type {
  RssReaderConfig,
  TitleCleanOptions,
  RssItem,
  RssFeed,
  RawRssItem,
  BrowserPoolStats,
} from './types';

// Errors
export {
  RssReaderError,
  FeedFetchError,
  ParseError,
  BrowserError,
  LinkNotFoundError,
  InvalidFeedError,
} from './errors/RssReaderErrors';

// Interfaces (for advanced users who want to extend functionality)
export type {
  IBrowserPool,
  IFeedFetcher,
  IItemParser,
  ILinkExtractor,
  ITitleCleaner,
  IUrlParser,
  IDateParser,
  IItemValidator,
  ILinkValidator,
  IRetryHandler,
} from './interfaces';
