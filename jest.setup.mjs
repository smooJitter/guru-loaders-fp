import { jest } from '@jest/globals';

// Make jest available globally
globalThis.jest = jest;

// Setup common test utilities and mocks
jest.setTimeout(10000); // 10 second timeout for all tests

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

// Export mock for use in tests
export { mockMongoose }; 