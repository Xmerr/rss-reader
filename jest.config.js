/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/interfaces/**',
    '!src/types/**',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Timeout for tests (30 seconds for Puppeteer operations)
  testTimeout: 30000,

  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        strict: true,
      },
    }],
  },

  // Verbose output
  verbose: true,
};
