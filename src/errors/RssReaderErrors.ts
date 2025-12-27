/**
 * Error hierarchy for @xmer/rss-reader
 */

/**
 * Base error class for all RSS reader errors
 */
export class RssReaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RssReaderError';
    Object.setPrototypeOf(this, RssReaderError.prototype);
  }
}

/**
 * Error thrown when feed fetching fails
 */
export class FeedFetchError extends RssReaderError {
  constructor(
    message: string,
    public readonly feedUrl: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'FeedFetchError';
    Object.setPrototypeOf(this, FeedFetchError.prototype);
  }
}

/**
 * Error thrown when parsing fails
 */
export class ParseError extends RssReaderError {
  constructor(
    message: string,
    public readonly feedUrl?: string,
    public readonly itemTitle?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Error thrown when browser operations fail
 */
export class BrowserError extends RssReaderError {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'BrowserError';
    Object.setPrototypeOf(this, BrowserError.prototype);
  }
}

/**
 * Error thrown when no links are found in content
 */
export class LinkNotFoundError extends RssReaderError {
  constructor(
    message: string,
    public readonly itemTitle: string
  ) {
    super(message);
    this.name = 'LinkNotFoundError';
    Object.setPrototypeOf(this, LinkNotFoundError.prototype);
  }
}

/**
 * Error thrown when feed structure is invalid
 */
export class InvalidFeedError extends RssReaderError {
  constructor(
    message: string,
    public readonly feedUrl: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'InvalidFeedError';
    Object.setPrototypeOf(this, InvalidFeedError.prototype);
  }
}
