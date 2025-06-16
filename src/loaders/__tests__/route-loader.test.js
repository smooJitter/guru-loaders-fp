import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { routeLoader } from '../route-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  routes: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid route factory
const validRouteFactory = jest.fn(() => ({ name: 'foo', method: 'get', path: '/foo', handler: jest.fn() }));
// Edge: duplicate route factories (same name)
const duplicateRouteFactoryA = jest.fn(() => ({ name: 'dupe', method: 'get', path: '/dupe', handler: jest.fn() }));
const duplicateRouteFactoryB = jest.fn(() => ({ name: 'dupe', method: 'get', path: '/dupe', handler: jest.fn() }));
// Failure: invalid route (missing name)
const invalidRouteFactory = jest.fn(() => ({ method: 'get', path: '/bad', handler: jest.fn() }));
// Failure: invalid route (not an object)
const invalidTypeRouteFactory = jest.fn(() => 42);

describe('routeLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid route object from a factory (happy path)', async () => {
    const files = ['foo.route.js'];
    const modules = { 'foo.route.js': { default: validRouteFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await routeLoader(ctx);
    expect(typeof result.routes).toBe('object');
    expect(result.routes.foo).toBeDefined();
    expect(result.routes.foo.path).toBe('/foo');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate route (same name) (edge case)', async () => {
    const files = ['dupeA.route.js', 'dupeB.route.js'];
    const modules = {
      'dupeA.route.js': { default: duplicateRouteFactoryA },
      'dupeB.route.js': { default: duplicateRouteFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await routeLoader(ctx);
    expect(typeof result.routes).toBe('object');
    expect(result.routes.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid route objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.route.js'];
    const modules = { 'bad.route.js': { default: invalidRouteFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await routeLoader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid route objects (not an object) and does not register them (failure)', async () => {
    const files = ['badtype.route.js'];
    const modules = { 'badtype.route.js': { default: invalidTypeRouteFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await routeLoader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await routeLoader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.route.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await routeLoader(ctx);
    expect(result.routes).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 