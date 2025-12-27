/**
 * Jest setup file for test configuration
 */

// Increase timeout for Puppeteer operations
jest.setTimeout(30000);

// Mock console methods to reduce test noise (optional)
// Uncomment if you want to suppress console output during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
