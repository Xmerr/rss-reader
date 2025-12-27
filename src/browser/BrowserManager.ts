/**
 * Manages lifecycle of a single Puppeteer browser instance
 */

import puppeteer, { type Browser } from 'puppeteer';
import { BrowserError } from '../errors/RssReaderErrors';

/**
 * Options for browser launch
 */
interface BrowserLaunchOptions {
  /** Run browser in headless mode (default: true) */
  headless?: boolean;

  /** Additional Puppeteer launch arguments */
  args?: string[];

  /**
   * Disable Chrome security sandbox (default: false)
   *
   * WARNING: Only set to true in controlled Docker/CI environments.
   * Disabling the sandbox removes Chrome's process isolation security,
   * which can expose the system to malicious content in feeds.
   *
   * @see https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux/sandboxing.md
   */
  disableSandbox?: boolean;
}

/**
 * Manages the lifecycle of a single Puppeteer browser instance.
 * Handles launching, crash detection, and cleanup.
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private launching = false;

  /**
   * Create a new BrowserManager
   * @param options - Browser launch options
   */
  constructor(private readonly options: BrowserLaunchOptions = {}) {}

  /**
   * Launch a new browser instance
   * @returns Puppeteer Browser instance
   * @throws BrowserError if launch fails
   *
   * @example
   * ```typescript
   * const manager = new BrowserManager({ headless: true });
   * const browser = await manager.launch();
   * // Use browser...
   * await manager.close();
   * ```
   */
  async launch(): Promise<Browser> {
    // If already launching, wait for it to complete
    if (this.launching) {
      // Wait for launch to complete (check every 100ms)
      while (this.launching) {
        await this.delay(100);
      }

      // Return the launched browser if successful
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    // If browser already exists and is connected, return it
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    // Launch a new browser
    this.launching = true;

    try {
      // Build args list - only include sandbox flags if explicitly enabled
      const defaultArgs = ['--disable-dev-shm-usage', '--disable-gpu'];

      if (this.options.disableSandbox === true) {
        defaultArgs.push('--no-sandbox', '--disable-setuid-sandbox');
      }

      const args = [
        ...defaultArgs,
        ...(this.options.args || []),
      ];

      this.browser = await puppeteer.launch({
        headless: this.options.headless !== false, // Default to true
        args,
      });

      // Set up disconnect handler to detect crashes
      this.browser.on('disconnected', () => {
        this.browser = null;
      });

      return this.browser;
    } catch (error) {
      this.browser = null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BrowserError(
        `Failed to launch browser: ${errorMessage}`,
        'launch',
        error instanceof Error ? error : undefined
      );
    } finally {
      this.launching = false;
    }
  }

  /**
   * Get the current browser instance
   * @returns Browser instance or null if not launched
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Check if browser is connected and ready
   * @returns true if browser is connected
   */
  isConnected(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  /**
   * Close the browser instance
   * @throws BrowserError if close fails
   */
  async close(): Promise<void> {
    if (!this.browser) {
      return;
    }

    try {
      await this.browser.close();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BrowserError(
        `Failed to close browser: ${errorMessage}`,
        'close',
        error instanceof Error ? error : undefined
      );
    } finally {
      this.browser = null;
    }
  }

  /**
   * Force kill the browser process
   * Use this as a last resort when normal close fails
   */
  async kill(): Promise<void> {
    if (!this.browser) {
      return;
    }

    try {
      const process = this.browser.process();
      if (process) {
        process.kill('SIGKILL');
      }
    } catch {
      // Ignore errors during force kill
    } finally {
      this.browser = null;
    }
  }

  /**
   * Restart the browser (close and relaunch)
   * @returns New browser instance
   */
  async restart(): Promise<Browser> {
    await this.close();
    return await this.launch();
  }

  /**
   * Delay execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
