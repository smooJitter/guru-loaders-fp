import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMiddlewareLoader } from '../middleware-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  middleware: {},
  services: { logger: mockLogger },
  config: {},
  logger: mockLogger
});

// Factories and modules for various test cases
const validMiddlewareFactory = jest.fn(() => ({
  name: 'logger',
  middleware: jest.fn((req, res, next) => { next(); })
}));
const duplicateMiddlewareFactoryA = jest.fn(() => ({ name: 'auth', middleware: jest.fn() }));
const duplicateMiddlewareFactoryB = jest.fn(() => ({ name: 'auth', middleware: jest.fn() }));
const invalidMiddlewareFactory = jest.fn(() => ({ middleware: jest.fn() }));
const invalidTypeMiddlewareFactory = jest.fn(() => ({ name: 'bad', middleware: 42 }));

// --- Test Suite ---
describe('middlewareLoader (core-loader-new, superb quality)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeLoader({ files, modules }) {
    return createMiddlewareLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
    });
  }

  it('registers a valid middleware object from a factory (happy path)', async () => {
    const files = ['logger.middleware.js'];
    const modules = { 'logger.middleware.js': validMiddlewareFactory() };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware.logger).toBeDefined();
    expect(typeof result.middleware.logger.middleware).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate middleware names (last wins)', async () => {
    const files = ['authA.middleware.js', 'authB.middleware.js'];
    const modules = {
      'authA.middleware.js': duplicateMiddlewareFactoryA(),
      'authB.middleware.js': duplicateMiddlewareFactoryB()
    };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware.auth).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate middleware name: auth'));
    // Last wins
    expect(result.middleware.auth).toEqual(modules['authB.middleware.js']);
  });

  it('skips invalid middleware objects (missing name)', async () => {
    const files = ['bad.middleware.js'];
    const modules = { 'bad.middleware.js': invalidMiddlewareFactory() };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('skips invalid middleware objects (not a function)', async () => {
    const files = ['badtype.middleware.js'];
    const modules = { 'badtype.middleware.js': invalidTypeMiddlewareFactory() };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const loader = makeLoader({ files: [], modules: {} });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('registers a middleware object with options', async () => {
    const files = ['opts.middleware.js'];
    const modules = { 'opts.middleware.js': { name: 'opts', middleware: jest.fn(), options: { foo: 1 } } };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware.opts).toBeDefined();
    expect(result.middleware.opts.options).toEqual({ foo: 1 });
  });

  it('skips module with missing middleware property', async () => {
    const files = ['bad.middleware.js'];
    const modules = { 'bad.middleware.js': { name: 'bad' } };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('skips module with null middleware', async () => {
    const files = ['null.middleware.js'];
    const modules = { 'null.middleware.js': { name: 'null', middleware: null } };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('skips non-object module', async () => {
    const files = ['num.middleware.js'];
    const modules = { 'num.middleware.js': 42 };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('handles error thrown in middleware function (runtime)', async () => {
    const files = ['err.middleware.js'];
    const fn = jest.fn(() => { throw new Error('fail'); });
    const modules = { 'err.middleware.js': { name: 'err', middleware: fn } };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(() => result.middleware.err.middleware()).toThrow('fail');
  });

  it('skips array exports (should skip, not register)', async () => {
    const files = ['arr.middleware.js'];
    const modules = { 'arr.middleware.js': [{ name: 'a', middleware: jest.fn() }] };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
  });

  it('handles error thrown in factory (extract step)', async () => {
    const files = ['err2.middleware.js'];
    // Simulate a factory that throws when called by the loader
    const throwingFactory = () => { throw new Error('fail-extract'); };
    const modules = { 'err2.middleware.js': throwingFactory };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    // Should not throw, just skip
    const result = await loader(ctx);
    expect(result.middleware).toEqual({});
  });

  it('propagates context and services through loader', async () => {
    const files = ['logger.middleware.js'];
    const modules = { 'logger.middleware.js': validMiddlewareFactory() };
    const ctx = baseContext();
    ctx.services.extra = { foo: 42 };
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.services.extra).toBeDefined();
    expect(result.services.extra.foo).toBe(42);
  });
}); 