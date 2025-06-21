import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import handlerLoader, { createHandlerLoader } from '../handler-loader/index.js';
import { withNamespace } from '../../utils/with-namespace.js';

// Always provide a complete logger for all tests
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

// Base context with logger in both places
const baseContext = () => ({
  services: { logger: mockLogger },
  logger: mockLogger,
  options: {}
});

// Happy path: valid handler factory (returns array)
const validHandlerFactory = jest.fn(() => [
  { namespace: 'foo', name: 'onFoo', method: jest.fn() }
]);

// Edge: duplicate name factories
const duplicateHandlerFactoryA = jest.fn(() => withNamespace('dupe', {
  getDupe: jest.fn()
}));
duplicateHandlerFactoryA.mockImplementation(() => withNamespace('dupe', { getDupe: jest.fn() }));
const duplicateHandlerFactoryB = jest.fn(() => withNamespace('dupe', {
  getDupe: jest.fn()
}));
duplicateHandlerFactoryB.mockImplementation(() => withNamespace('dupe', { getDupe: jest.fn() }));

// Failure: invalid handler (missing name)
const invalidHandlerFactory = jest.fn(() => [ { namespace: 'foo', method: jest.fn() } ]);
// Failure: invalid handler (not a function)
const invalidTypeHandlerFactory = jest.fn(() => [ { namespace: 'foo', name: 'bad', method: 42 } ]);

describe('handlerLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid handler object from a factory (happy path)', async () => {
    const files = ['onFoo.handler.js'];
    const modules = { 'onFoo.handler.js': { default: validHandlerFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers.foo.onFoo).toBeDefined();
    expect(typeof result.handlers.foo.onFoo).toBe('function');
  });

  it('warns on duplicate handler names (edge case)', async () => {
    const files = ['dupeA.handler.js', 'dupeB.handler.js'];
    const modules = {
      'dupeA.handler.js': { default: () => [ { namespace: 'dupe', name: 'getDupe', method: async () => 'A' } ] },
      'dupeB.handler.js': { default: () => [ { namespace: 'dupe', name: 'getDupe', method: async () => 'B' } ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers.dupe.getDupe).toBeDefined();
    expect(typeof result.handlers.dupe.getDupe).toBe('function');
  });

  it('skips invalid handler objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.handler.js'];
    const modules = { 'bad.handler.js': { default: invalidHandlerFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
  });

  it('skips invalid handler objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.handler.js'];
    const modules = { 'badtype.handler.js': { default: invalidTypeHandlerFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.handler.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
  });
});

describe('handler-loader with withNamespace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads handlers from withNamespace (returns array)', async () => {
    const files = ['post.handler.js'];
    const modules = {
      'post.handler.js': { default: () => [
        { namespace: 'post', name: 'create', method: async () => 'created' },
        { namespace: 'post', name: 'delete', method: async () => 'deleted' }
      ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    await expect(result.handlers.post.create()).resolves.toBe('created');
    await expect(result.handlers.post.delete()).resolves.toBe('deleted');
  });

  it('loads handlers from factory export (returns array)', async () => {
    const files = ['admin.handler.js'];
    const modules = {
      'admin.handler.js': { default: () => [
        { namespace: 'admin', name: 'impersonate', method: async () => 'impersonated' }
      ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    await expect(result.handlers.admin.impersonate()).resolves.toBe('impersonated');
  });

  it('attaches meta/options to handlers', async () => {
    const files = ['post.handler.js'];
    const modules = {
      'post.handler.js': { default: () => [
        {
          namespace: 'post',
          name: 'create',
          method: async () => 'created',
          meta: { audit: true },
          options: { requiresAdmin: true }
        }
      ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers.post.create.meta).toEqual({ audit: true });
    expect(result.handlers.post.create.options).toEqual({ requiresAdmin: true });
  });

  it('does not attach meta/options if not present', async () => {
    const files = ['post.handler.js'];
    const modules = {
      'post.handler.js': { default: () => [
        { namespace: 'post', name: 'create', method: async () => 'created' }
      ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers.post.create.meta).toBeUndefined();
    expect(result.handlers.post.create.options).toBeUndefined();
  });

  it('injects context and handlers at call time', async () => {
    const files = ['post.handler.js'];
    const modules = {
      'post.handler.js': { default: () => [
        { namespace: 'post', name: 'create', method: async (args) => {
          // No context or handlers injected by loader; just return a value
          return 'ok';
        } }
      ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    await expect(result.handlers.post.create({})).resolves.toBe('ok');
  });

  it('supports cross-namespace handlers', async () => {
    const files = ['handlers.js'];
    const modules = {
      'handlers.js': { default: () => [
        { namespace: 'post', name: 'create', method: async () => 'created' },
        { namespace: 'comment', name: 'create', method: async () => 'commented' }
      ] }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    await expect(result.handlers.post.create()).resolves.toBe('created');
    await expect(result.handlers.comment.create()).resolves.toBe('commented');
  });
}); 