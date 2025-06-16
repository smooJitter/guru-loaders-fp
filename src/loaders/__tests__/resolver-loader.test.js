import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { resolverLoader } from '../resolver-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  resolvers: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid resolver factory
const validResolverFactory = jest.fn(() => ([
  { namespace: 'user', name: 'getUser', method: jest.fn() }
]));

// Edge: duplicate name factories
const duplicateResolverFactoryA = jest.fn(() => ([
  { namespace: 'dupe', name: 'getDupe', method: jest.fn() }
]));
const duplicateResolverFactoryB = jest.fn(() => ([
  { namespace: 'dupe', name: 'getDupe', method: jest.fn() }
]));

// Failure: invalid resolver (missing name)
const invalidResolverFactory = jest.fn(() => ([
  { namespace: 'bad', name: undefined, method: jest.fn() }
]));
// Failure: invalid resolver (not a function)
const invalidTypeResolverFactory = jest.fn(() => ([
  { namespace: 'bad', name: 'getBad', method: 42 }
]));

describe('resolverLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid resolver object from a factory (happy path)', async () => {
    const files = ['UserResolver.resolver.js'];
    const modules = { 'UserResolver.resolver.js': { default: validResolverFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers.user).toBeDefined();
    expect(result.resolvers.user.getUser).toBeDefined();
    expect(typeof result.resolvers.user.getUser).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate resolver names (edge case)', async () => {
    const files = ['dupeA.resolver.js', 'dupeB.resolver.js'];
    const modules = {
      'dupeA.resolver.js': { default: duplicateResolverFactoryA },
      'dupeB.resolver.js': { default: duplicateResolverFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers.dupe).toBeDefined();
    expect(result.resolvers.dupe.getDupe).toBeDefined();
    expect(typeof result.resolvers.dupe.getDupe).toBe('function');
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid resolver objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.resolver.js'];
    const modules = { 'bad.resolver.js': { default: invalidResolverFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid resolver objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.resolver.js'];
    const modules = { 'badtype.resolver.js': { default: invalidTypeResolverFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.resolver.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('registers a valid resolver object from a plain object (happy path)', async () => {
    const files = ['PlainResolver.resolver.js'];
    const modules = { 'PlainResolver.resolver.js': { default: { plain: { getPlain: jest.fn() } } } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await resolverLoader(ctx);
    expect(result.resolvers.plain).toBeDefined();
    expect(result.resolvers.plain.getPlain).toBeDefined();
    expect(typeof result.resolvers.plain.getPlain).toBe('function');
  });
}); 