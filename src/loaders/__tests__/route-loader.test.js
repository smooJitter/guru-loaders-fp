import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createRouteLoader } from '../route-loader.js';
import * as R from 'ramda';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  routes: {},
  services: { logger: mockLogger },
  config: {},
  logger: mockLogger
});

// Factories and modules for various test cases
const validRouteFactory = jest.fn(() => ({
  name: 'getUser',
  method: 'GET',
  path: '/user',
  handler: jest.fn()
}));
const validRouteObject = {
  name: 'createUser',
  method: 'POST',
  path: '/user',
  handler: jest.fn()
};
const validRouteArray = [
  { name: 'listUsers', method: 'GET', path: '/users', handler: jest.fn() },
  { name: 'deleteUser', method: 'DELETE', path: '/user/:id', handler: jest.fn() }
];
const duplicateRouteA = { name: 'dupe', method: 'GET', path: '/a', handler: jest.fn() };
const duplicateRouteB = { name: 'dupe', method: 'POST', path: '/b', handler: jest.fn() };
const invalidRouteNoName = { method: 'GET', path: '/bad', handler: jest.fn() };
const invalidRouteNoMethod = { name: 'bad', path: '/bad', handler: jest.fn() };
const invalidRouteNoPath = { name: 'bad', method: 'GET', handler: jest.fn() };
const invalidRouteNoHandler = { name: 'bad', method: 'GET', path: '/bad' };
const invalidRouteNotObject = 42;
const invalidRouteHandlerNotFunction = { name: 'bad', method: 'GET', path: '/bad', handler: 123 };

// --- Test Suite ---
describe('routeLoader (core-loader-new, superb quality)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeLoader({ files, modules }) {
    return createRouteLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) =>
        R.flatten(_files.map(f => modules[f])),
    });
  }

  // Happy path: factory
  it('registers a valid route object from a factory (happy path)', async () => {
    const files = ['getUser.route.js'];
    const modules = { 'getUser.route.js': validRouteFactory() };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes.getUser).toBeDefined();
    expect(result.routes.getUser.method).toBe('GET');
    expect(result.routes.getUser.path).toBe('/user');
    expect(typeof result.routes.getUser.handler).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  // Happy path: plain object
  it('registers a valid route plain object (happy path)', async () => {
    const files = ['createUser.route.js'];
    const modules = { 'createUser.route.js': validRouteObject };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes.createUser).toBeDefined();
    expect(result.routes.createUser.method).toBe('POST');
    expect(result.routes.createUser.path).toBe('/user');
    expect(typeof result.routes.createUser.handler).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  // Happy path: array
  it('registers multiple routes from an array (happy path)', async () => {
    const files = ['multi.route.js'];
    const modules = { 'multi.route.js': validRouteArray };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes.listUsers).toBeDefined();
    expect(result.routes.deleteUser).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  // Duplicate names
  it('warns on duplicate route names (last wins)', async () => {
    const files = ['dupeA.route.js', 'dupeB.route.js'];
    const modules = {
      'dupeA.route.js': duplicateRouteA,
      'dupeB.route.js': duplicateRouteB
    };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate route name: dupe'));
    expect(result.routes.dupe).toEqual(duplicateRouteB);
  });

  // Invalid: missing name
  it('skips invalid route objects (missing name)', async () => {
    const files = ['bad.route.js'];
    const modules = { 'bad.route.js': invalidRouteNoName };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  // Invalid: missing method
  it('skips invalid route objects (missing method)', async () => {
    const files = ['bad.route.js'];
    const modules = { 'bad.route.js': invalidRouteNoMethod };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  // Invalid: missing path
  it('skips invalid route objects (missing path)', async () => {
    const files = ['bad.route.js'];
    const modules = { 'bad.route.js': invalidRouteNoPath };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  // Invalid: missing handler
  it('skips invalid route objects (missing handler)', async () => {
    const files = ['bad.route.js'];
    const modules = { 'bad.route.js': invalidRouteNoHandler };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  // Invalid: handler not a function
  it('skips route with non-function handler', async () => {
    const files = ['bad.route.js'];
    const modules = { 'bad.route.js': invalidRouteHandlerNotFunction };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  // Invalid: not an object
  it('skips non-object module', async () => {
    const files = ['num.route.js'];
    const modules = { 'num.route.js': invalidRouteNotObject };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  // Array with all invalids
  it('skips array with all invalid routes (should result in empty registry)', async () => {
    const files = ['arr.route.js'];
    const modules = { 'arr.route.js': [invalidRouteNoName, invalidRouteNoMethod] };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
  });

  // Array with some invalids
  it('skips array with invalid routes', async () => {
    const files = ['arr.route.js'];
    const modules = { 'arr.route.js': [invalidRouteNoName, validRouteObject] };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.routes.createUser).toBeDefined();
    expect(Object.keys(result.routes)).toHaveLength(1);
  });

  // Factory that throws
  it('handles error thrown in factory (should skip, not throw)', async () => {
    const files = ['err.route.js'];
    const throwingFactory = () => { throw new Error('fail-extract'); };
    const modules = { 'err.route.js': throwingFactory };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    // Should not throw, just skip
    let result;
    try {
      result = await loader(ctx);
    } catch (e) {
      result = { routes: null };
    }
    expect(result.routes).toBeDefined();
    expect(result.routes).toEqual({});
  });

  // Empty file list
  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const loader = makeLoader({ files: [], modules: {} });
    const result = await loader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  // Context propagation
  it('propagates context and services through loader', async () => {
    const files = ['getUser.route.js'];
    const modules = { 'getUser.route.js': validRouteFactory() };
    const ctx = baseContext();
    ctx.services.extra = { foo: 42 };
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.services.extra).toBeDefined();
    expect(result.services.extra.foo).toBe(42);
  });
}); 