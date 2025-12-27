/**
 * Utility for executing operations with retry logic and exponential backoff
 */

import type { IRetryHandler } from '../interfaces';

/**
 * Options for retry behavior
 */
interface RetryOptions {
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;

  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;

  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
}

/**
 * Handles retry logic with exponential backoff for transient failures.
 * Useful for network operations, browser automation, and other operations
 * that may fail temporarily but succeed on retry.
 */
export class RetryHandler implements IRetryHandler {
  private readonly options: Required<RetryOptions>;

  /**
   * Create a new RetryHandler
   * @param options - Retry configuration options
   */
  constructor(options: RetryOptions = {}) {
    this.options = {
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 30000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
    };
  }

  /**
   * Execute an operation with retry logic and exponential backoff
   * @param operation - Async operation to execute (should throw on failure)
   * @param maxAttempts - Maximum number of attempts (includes initial attempt)
   * @returns Result of the operation
   * @throws Last error if all attempts fail
   *
   * @example
   * ```typescript
   * const handler = new RetryHandler({ initialDelay: 1000, maxDelay: 30000 });
   *
   * // Retry a network operation up to 3 times
   * const result = await handler.executeWithRetry(
   *   async () => await fetchFeed(url),
   *   3
   * );
   *
   * // Custom retry configuration
   * const customHandler = new RetryHandler({
   *   initialDelay: 500,
   *   backoffMultiplier: 3
   * });
   * ```
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    // Validate maxAttempts
    if (maxAttempts < 1) {
      throw new Error('maxAttempts must be at least 1');
    }

    let lastError: Error | undefined;
    let currentDelay = this.options.initialDelay;

    // Attempt the operation up to maxAttempts times
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Execute the operation
        return await operation();
      } catch (error) {
        // Store the error for potential re-throw
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this was the last attempt, throw the error
        if (attempt === maxAttempts) {
          break;
        }

        // Wait before retrying (with exponential backoff)
        await this.delay(currentDelay);

        // Calculate next delay with exponential backoff
        // Ensure delay doesn't exceed maxDelay
        currentDelay = Math.min(
          currentDelay * this.options.backoffMultiplier,
          this.options.maxDelay
        );
      }
    }

    // All attempts failed - throw the last error
    throw lastError;
  }

  /**
   * Delay execution for specified milliseconds
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Static utility method for one-off retry without instantiation
   * @param operation - Async operation to execute
   * @param maxAttempts - Maximum attempts
   * @param options - Retry options
   * @returns Operation result
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    options?: RetryOptions
  ): Promise<T> {
    const handler = new RetryHandler(options);
    return handler.executeWithRetry(operation, maxAttempts);
  }
}
