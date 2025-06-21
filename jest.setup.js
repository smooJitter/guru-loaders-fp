import { jest } from '@jest/globals';

globalThis.jest = jest;

jest.setTimeout(10000); // 10 second timeout for all tests

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};
globalThis.mockLogger = mockLogger;

const mockMongoose = {
  Schema: jest.fn(),
  model: jest.fn(),
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
    once: jest.fn()
  }
};

const mockModule = { default: mockMongoose };
// jest.unstable_mockModule('mongoose', () => mockModule);
// ^ Only enable this for test suites that import mongoose

export { mockMongoose }; 