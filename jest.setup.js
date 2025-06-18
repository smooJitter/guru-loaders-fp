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

// Mock file utilities
const mockFileUtils = {
  findFiles: jest.fn(),
  importAndApply: jest.fn(),
  watchFiles: jest.fn().mockImplementation(() => () => {}),
};

// Mock async pipeline utilities
const mockAsyncPipelineUtils = {
  pipeAsync: jest.fn().mockImplementation((...fns) => async (x) => {
    let result = x;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  })
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

// Mock file-utils-new.js using alias
jest.unstable_mockModule('@/utils/file-utils-new.js', () => mockFileUtils);

// Mock async-pipeline-utils.js using alias
jest.unstable_mockModule('@/utils/async-pipeline-utils.js', () => mockAsyncPipelineUtils);

// Export mocks for use in tests
globalThis.mockMongoose = mockMongoose;
globalThis.mockLogger = mockLogger;
globalThis.mockFileUtils = mockFileUtils;
globalThis.mockAsyncPipelineUtils = mockAsyncPipelineUtils; 