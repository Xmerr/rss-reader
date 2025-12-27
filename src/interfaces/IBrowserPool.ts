/**
 * Interface for browser pool management
 */

import type { Browser } from 'puppeteer';
import type { BrowserPoolStats } from '../types';

/**
 * Manages a pool of Puppeteer browser instances for reuse
 */
export interface IBrowserPool {
  /**
   * Initialize the browser pool
   */
  initialize(): Promise<void>;

  /**
   * Acquire a browser from the pool
   * Waits if all browsers are in use
   */
  acquire(): Promise<Browser>;

  /**
   * Release a browser back to the pool
   */
  release(browser: Browser): Promise<void>;

  /**
   * Close all browsers and cleanup
   */
  close(): Promise<void>;

  /**
   * Get current pool statistics
   */
  getStats(): BrowserPoolStats;

  /**
   * Check if pool is initialized
   */
  isInitialized(): boolean;
}
