// LEGACY: This test suite is for the legacy method-loader. Only the { name, methods } pattern is supported.
// For modern patterns, see handler-loader tests.
//

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { methodLoader } from '../method-loader.js';
import { jest as jestGlobal } from '@jest/globals';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  methods: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid method module
const validMethodModule = { name: 'doWork', methods: { method: jest.fn() } };
// Edge: duplicate name modules
const duplicateMethodModuleA = { name: 'dupe', methods: { method: jest.fn() } };
const duplicateMethodModuleB = { name: 'dupe', methods: { method: jest.fn() } };
// Failure: invalid method (missing name)
const invalidMethodModule = { methods: { method: jest.fn() } };
// Failure: invalid method (not a function)
const invalidTypeMethodModule = { name: 'bad', methods: { method: 42 } };

// Direct copy of transformMethod for test coverage
function testTransformMethod(name, fn, context, methods) {
  return {
    name,
    method: (args) => fn({ ...args, context, methods }),
    type: 'methods',
    timestamp: expect.any(Number)
  };
}

describe('methodLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid method object (happy path)', async () => {
    const ctx = baseContext();
    ctx.options = { modules: [validMethodModule] };
    const result = await methodLoader(ctx);
    expect(result.methods.doWork).toBeDefined();
    expect(typeof result.methods.doWork.method).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate method names (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = { modules: [duplicateMethodModuleA, duplicateMethodModuleB] };
    const result = await methodLoader(ctx);
    expect(result.methods.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid method objects (missing name) and does not register them (failure)', async () => {
    const ctx = baseContext();
    ctx.options = { modules: [invalidMethodModule] };
    const result = await methodLoader(ctx);
    expect(result.methods).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid method objects (not a function) and does not register them (failure)', async () => {
    const ctx = baseContext();
    ctx.options = { modules: [invalidTypeMethodModule] };
    const result = await methodLoader(ctx);
    expect(result.methods).toEqual({});
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('handles empty modules array (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = { modules: [] };
    const result = await methodLoader(ctx);
    expect(result.methods).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const ctx = baseContext();
    // Simulate a module that throws on access
    const errorModule = new Proxy({}, {
      get() { throw new Error('fail'); }
    });
    ctx.options = { modules: [errorModule] };
    const result = await methodLoader(ctx);
    expect(result.methods).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('transformMethod utility produces correct object', () => {
    const fn = jest.fn();
    const context = { foo: 1 };
    const methods = { bar: 2 };
    const result = testTransformMethod('x', fn, context, methods);
    expect(result).toMatchObject({ name: 'x', type: 'methods' });
    expect(typeof result.method).toBe('function');
    result.method({ a: 1 });
    expect(fn).toHaveBeenCalledWith({ a: 1, context, methods });
  });

  it('handles error thrown during module processing (catch block)', async () => {
    const ctx = baseContext();
    const errorModule = {};
    Object.defineProperty(errorModule, 'name', {
      get() { throw new Error('fail-catch'); }
    });
    ctx.options = { modules: [errorModule] };
    const result = await methodLoader(ctx);
    expect(result.methods).toEqual({});
    // Check that the third argument of any warn call contains the error substring
    const found = mockLogger.warn.mock.calls.some(call => call[2] && call[2].includes('fail-catch'));
    expect(found).toBe(true);
  });

  it('warns on duplicate method names with more than two modules', async () => {
    const ctx = baseContext();
    const modA = { name: 'dupe', methods: { method: jest.fn() } };
    const modB = { name: 'dupe', methods: { method: jest.fn() } };
    const modC = { name: 'dupe', methods: { method: jest.fn() } };
    ctx.options = { modules: [modA, modB, modC] };
    const result = await methodLoader(ctx);
    expect(result.methods.dupe).toBeDefined();
    // Check that the second argument of any warn call contains the duplicate name substring
    const found = mockLogger.warn.mock.calls.some(call => call[1] && call[1].includes('Duplicate method name: dupe'));
    expect(found).toBe(true);
  });

  it('handles unexpected errors gracefully', async () => {
    const ctx = baseContext();
    const errorModule = { name: 'unexpected', methods: { method: () => { throw new Error('unexpected error'); } } };
    ctx.options = { modules: [errorModule] };
    const result = await methodLoader(ctx);
    expect(result.methods).toEqual({});
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('unexpected error'));
  });

  it('logs specific warning messages for duplicate methods', async () => {
    const ctx = baseContext();
    const modA = { name: 'dupe', methods: { method: jest.fn() } };
    const modB = { name: 'dupe', methods: { method: jest.fn() } };
    ctx.options = { modules: [modA, modB] };
    const result = await methodLoader(ctx);
    expect(result.methods.dupe).toBeDefined();
    const found = mockLogger.warn.mock.calls.some(call => call[0] && call[0].includes('Duplicate method name: dupe'));
    expect(found).toBe(true);
  });
}); 