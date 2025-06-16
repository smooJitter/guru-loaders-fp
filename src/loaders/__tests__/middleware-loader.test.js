import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { middlewareLoader } from '../middleware-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  middleware: {},
  services: {},
  config: {},
  logger: mockLogger
});

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

describe('middlewareLoader (pipeline-friendly)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid middleware object from a factory (happy path)', async () => {
    const files = ['logger.middleware.js'];
    const modules = { 'logger.middleware.js': { default: validMiddlewareFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
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
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware.auth).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid middleware objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.middleware.js'];
    const modules = { 'bad.middleware.js': { default: invalidMiddlewareFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid middleware objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.middleware.js'];
    const modules = { 'badtype.middleware.js': { default: invalidTypeMiddlewareFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.middleware.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('registers a middleware object with options', async () => {
    const files = ['opts.middleware.js'];
    const modules = { 'opts.middleware.js': { default: () => ({ name: 'opts', middleware: jest.fn(), options: { foo: 1 } }) } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware.opts).toBeDefined();
    expect(result.middleware.opts.options).toEqual({ foo: 1 });
  });

  it('skips module with missing middleware property', async () => {
    const files = ['bad.middleware.js'];
    const modules = { 'bad.middleware.js': { default: () => ({ name: 'bad' }) } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips module with null middleware', async () => {
    const files = ['null.middleware.js'];
    const modules = { 'null.middleware.js': { default: () => ({ name: 'null', middleware: null }) } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips non-object module', async () => {
    const files = ['num.middleware.js'];
    const modules = { 'num.middleware.js': { default: 42 } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles error thrown in middleware function', async () => {
    const files = ['err.middleware.js'];
    const fn = jest.fn(() => { throw new Error('fail'); });
    const modules = { 'err.middleware.js': { default: () => ({ name: 'err', middleware: fn }) } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(() => result.middleware.err.middleware()).toThrow('fail');
  });

  it('skips factory returning array (should skip)', async () => {
    const files = ['arr.middleware.js'];
    const modules = { 'arr.middleware.js': { default: () => [{ name: 'a', middleware: jest.fn() }] } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles error thrown during per-module processing (catch block)', async () => {
    const files = ['err2.middleware.js'];
    // Simulate extractMiddleware throwing
    const modules = { 'err2.middleware.js': { default: () => { throw new Error('fail-extract'); } } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await middlewareLoader(ctx);
    expect(result.middleware).toEqual({});
    // Check that the second argument of any warn call contains the error substring
    const found = mockLogger.warn.mock.calls.some(call => call[1] && call[1].includes('fail-extract'));
    expect(found).toBe(true);
  });
}); 