/**
 * Pool of Puppeteer browser instances for reuse across requests
 */

import type { Browser } from 'puppeteer';
import type { IBrowserPool } from '../interfaces';
import type { BrowserPoolStats } from '../types';
import { BrowserManager } from './BrowserManager';
import { BrowserError } from '../errors/RssReaderErrors';

/**
 * Browser pool configuration options
 */
interface BrowserPoolOptions {
  /** Number of browsers to maintain in the pool (default: 2) */
  poolSize?: number;

  /** Disable Chrome security sandbox (default: false). WARNING: Only for Docker/CI */
  disableSandbox?: boolean;
}

/**
 * Manages a pool of Puppeteer browser instances for reuse.
 * Uses acquire/release pattern to prevent browser exhaustion.
 * Default pool size is 2 browsers.
 */
export class BrowserPool implements IBrowserPool {
  private managers: BrowserManager[] = [];
  private availableBrowsers: Browser[] = [];
  private busyBrowsers: Set<Browser> = new Set();
  private initialized = false;
  private waitQueue: Array<(browser: Browser) => void> = [];
  private readonly poolSize: number;
  private readonly disableSandbox: boolean;

  /**
   * Create a new BrowserPool
   * @param options - Pool configuration options
   */
  constructor(options: BrowserPoolOptions = {}) {
    this.poolSize = options.poolSize ?? 2;
    this.disableSandbox = options.disableSandbox ?? false;

    if (this.poolSize < 1) {
      throw new Error('Pool size must be at least 1');
    }
  }

  /**
   * Initialize the browser pool by launching all browsers
   * @throws BrowserError if any browser fails to launch
   *
   * @example
   * ```typescript
   * const pool = new BrowserPool(2);
   * await pool.initialize();
   * const browser = await pool.acquire();
   * // Use browser...
   * await pool.release(browser);
   * await pool.close();
   * ```
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create browser managers
      this.managers = Array.from(
        { length: this.poolSize },
        () => new BrowserManager({ headless: true, disableSandbox: this.disableSandbox })
      );

      // Launch all browsers in parallel
      const launchPromises = this.managers.map(manager => manager.launch());
      const browsers = await Promise.all(launchPromises);

      // Add all browsers to available pool
      this.availableBrowsers = [...browsers];
      this.busyBrowsers = new Set();

      this.initialized = true;
    } catch (error) {
      // Cleanup any partially initialized browsers
      await this.cleanup();

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BrowserError(
        `Failed to initialize browser pool: ${errorMessage}`,
        'initialize',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Acquire a browser from the pool
   * Waits if all browsers are currently in use
   * @param maxRetries - Maximum retry attempts for browser crashes (default: 3)
   * @param attempt - Current attempt number (for internal use)
   * @returns Browser instance from the pool
   * @throws BrowserError if pool is not initialized or max retries exceeded
   *
   * @example
   * ```typescript
   * const browser = await pool.acquire();
   * try {
   *   // Use browser for operations
   *   const page = await browser.newPage();
   *   // ...
   * } finally {
   *   await pool.release(browser);
   * }
   * ```
   */
  async acquire(maxRetries = 3, attempt = 0): Promise<Browser> {
    if (!this.initialized) {
      throw new BrowserError(
        'Browser pool is not initialized. Call initialize() first.',
        'acquire'
      );
    }

    if (attempt >= maxRetries) {
      throw new BrowserError(
        `Failed to acquire browser after ${maxRetries} retry attempts`,
        'acquire'
      );
    }

    // If a browser is available, return it immediately
    if (this.availableBrowsers.length > 0) {
      const browser = this.availableBrowsers.pop()!;

      // Verify browser is still connected
      if (!browser.isConnected()) {
        // Browser crashed - try to recover
        await this.recoverBrowser(browser);
        // Retry acquire with incremented attempt counter
        return this.acquire(maxRetries, attempt + 1);
      }

      this.busyBrowsers.add(browser);
      return browser;
    }

    // All browsers are busy - wait for one to be released (with timeout)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from wait queue
        const index = this.waitQueue.indexOf(resolve);
        if (index > -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new BrowserError(
          'Browser acquisition timeout after 60 seconds',
          'acquire'
        ));
      }, 60000); // 60 second timeout

      this.waitQueue.push((browser) => {
        clearTimeout(timeout);
        resolve(browser);
      });
    });
  }

  /**
   * Release a browser back to the pool
   * @param browser - Browser to release
   * @throws BrowserError if browser is not from this pool
   *
   * @example
   * ```typescript
   * const browser = await pool.acquire();
   * try {
   *   // Use browser...
   * } finally {
   *   await pool.release(browser);
   * }
   * ```
   */
  async release(browser: Browser): Promise<void> {
    if (!this.initialized) {
      throw new BrowserError(
        'Browser pool is not initialized',
        'release'
      );
    }

    // Check if browser is in busy set
    if (!this.busyBrowsers.has(browser)) {
      throw new BrowserError(
        'Browser is not from this pool or was already released',
        'release'
      );
    }

    // Remove from busy set
    this.busyBrowsers.delete(browser);

    // If there are waiting requests, fulfill the next one
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;

      // Verify browser is still connected before giving to waiter
      if (!browser.isConnected()) {
        await this.recoverBrowser(browser);
        // Get a working browser for the waiter
        // Note: acquire() already handles adding to busyBrowsers
        const workingBrowser = await this.acquire();
        resolve(workingBrowser);
      } else {
        this.busyBrowsers.add(browser);
        resolve(browser);
      }
    } else {
      // No waiting requests - return to available pool
      this.availableBrowsers.push(browser);
    }
  }

  /**
   * Close all browsers and cleanup the pool
   * @throws BrowserError if cleanup fails
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.cleanup();
  }

  /**
   * Get current pool statistics
   * @returns Pool statistics (total, available, in use)
   */
  getStats(): BrowserPoolStats {
    return {
      total: this.poolSize,
      available: this.availableBrowsers.length,
      inUse: this.busyBrowsers.size,
    };
  }

  /**
   * Check if pool is initialized
   * @returns true if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Recover a crashed browser by restarting it
   * @param browser - Crashed browser instance
   */
  private async recoverBrowser(browser: Browser): Promise<void> {
    // Find the manager for this browser
    const manager = this.managers.find(m => m.getBrowser() === browser);

    if (!manager) {
      throw new BrowserError(
        'Cannot recover browser: manager not found',
        'recover'
      );
    }

    try {
      // Restart the browser
      const newBrowser = await manager.restart();

      // Update references
      const availableIndex = this.availableBrowsers.indexOf(browser);
      if (availableIndex !== -1) {
        this.availableBrowsers[availableIndex] = newBrowser;
      }

      // If browser was in busy set, replace it
      if (this.busyBrowsers.has(browser)) {
        this.busyBrowsers.delete(browser);
        this.busyBrowsers.add(newBrowser);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BrowserError(
        `Failed to recover browser: ${errorMessage}`,
        'recover',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Cleanup all browsers and reset pool state
   */
  private async cleanup(): Promise<void> {
    // Clear wait queue
    this.waitQueue = [];

    // Close all browsers
    const closePromises = this.managers.map(manager =>
      manager.close().catch(() => {
        // Ignore close errors - try force kill
        return manager.kill();
      })
    );

    await Promise.all(closePromises);

    // Reset state
    this.managers = [];
    this.availableBrowsers = [];
    this.busyBrowsers.clear();
    this.initialized = false;
  }
}
