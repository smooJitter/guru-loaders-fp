import { jest } from '@jest/globals';

// Make jest available globally
globalThis.jest = jest;

// Setup common test utilities and mocks
jest.setTimeout(10000); // 10 second timeout for all tests

// Common mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Setup common mocks
const mockMongoose = {
  Schema: jest.fn(),
  model: jest.fn(),
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
    once: jest.fn()
  }
};

// Mock mongoose module
const mockModule = { default: mockMongoose };
jest.unstable_mockModule('mongoose', () => mockModule);

// Mock the logger module
jest.unstable_mockModule('./src/utils/loader-logger.js', () => ({
  getLoaderLogger: () => mockLogger
}));

// Export mocks for use in tests
export { mockMongoose };
export { mockLogger }; 