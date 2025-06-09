import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMiddlewareLoader } from '../middleware-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockContext = { middleware: {}, services: {}, config: {}, logger: mockLogger };

// Happy path: valid middleware factory
const validMiddlewareFactory = jest.fn(() => ({
  name: 'logger',
  middleware: jest.fn((req, res, next) => { next(); })
}));

// Edge: duplicate name factories
const duplicateMiddlewareFactoryA = jest.fn(() => ({ name: 'auth', middleware: jest.fn() }));
const duplicateMiddlewareFactoryB = jest.fn(() => ({ name: 'auth', middleware: jest.fn() }));

// Failure: invalid middleware (missing name)
const invalidMiddlewareFactory = jest.fn(() => ({ middleware: jest.fn() }));
// Failure: invalid middleware (not a function)
const invalidTypeMiddlewareFactory = jest.fn(() => ({ name: 'bad', middleware: 42 }));

describe('createMiddlewareLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers a valid middleware object from a factory (happy path)', async () => {
    const files = ['logger.middleware.js'];
    const modules = { 'logger.middleware.js': { default: validMiddlewareFactory } };
    const loader = createMiddlewareLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext });
    expect(result.middleware.logger).toBeDefined();
    expect(typeof result.middleware.logger.middleware).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate middleware names (edge case)', async () => {
    const files = ['authA.middleware.js', 'authB.middleware.js'];
    const modules = {
      'authA.middleware.js': { default: duplicateMiddlewareFactoryA },
      'authB.middleware.js': { default: duplicateMiddlewareFactoryB }
    };
    const loader = createMiddlewareLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext });
    expect(result.middleware.auth).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid middleware objects and does not register them (missing name)', async () => {
    const files = ['bad.middleware.js'];
    const modules = { 'bad.middleware.js': { default: invalidMiddlewareFactory } };
    const loader = createMiddlewareLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext });
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid middleware objects and does not register them (not a function)', async () => {
    const files = ['badtype.middleware.js'];
    const modules = { 'badtype.middleware.js': { default: invalidTypeMiddlewareFactory } };
    const loader = createMiddlewareLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext });
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 