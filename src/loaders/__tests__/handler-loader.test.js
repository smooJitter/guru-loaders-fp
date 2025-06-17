import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import handlerLoader from '../handler-loader/index.js';
import { withNamespace } from 'guru-loaders-fp/utils';
import { extractHandlers } from '../handler-loader/lib/extractHandlers.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  handlers: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid handler factory
const validHandlerFactory = jest.fn(() => withNamespace('foo', {
  onFoo: jest.fn()
}));
validHandlerFactory.mockImplementation(() => withNamespace('foo', { onFoo: jest.fn() }));

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
const invalidHandlerFactory = jest.fn(() => ({ handler: jest.fn() }));
// Failure: invalid handler (not a function)
const invalidTypeHandlerFactory = jest.fn(() => ({ name: 'bad', handler: 42 }));

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
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate handler names (edge case)', async () => {
    const files = ['dupeA.handler.js', 'dupeB.handler.js'];
    const modules = {
      'dupeA.handler.js': { default: duplicateHandlerFactoryA },
      'dupeB.handler.js': { default: duplicateHandlerFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers.dupe.getDupe).toBeDefined();
    expect(typeof result.handlers.dupe.getDupe).toBe('function');
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid handler objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.handler.js'];
    const modules = { 'bad.handler.js': { default: invalidHandlerFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid handler objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.handler.js'];
    const modules = { 'badtype.handler.js': { default: invalidTypeHandlerFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await handlerLoader(ctx);
    expect(result.handlers).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
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
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});

describe('handler-loader', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
  const mockContext = { services: { logger: mockLogger } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads handlers from withNamespace (extractHandlers)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'created',
        delete: async () => 'deleted'
      }) }
    ];
    const registry = extractHandlers(modules, mockContext);
    await expect(registry.post.create()).resolves.toBe('created');
    await expect(registry.post.delete()).resolves.toBe('deleted');
  });

  it('loads handlers from factory export (extractHandlers)', async () => {
    const modules = [
      { default: () => withNamespace('admin', {
        impersonate: async () => 'impersonated'
      }) }
    ];
    const registry = extractHandlers(modules, mockContext);
    await expect(registry.admin.impersonate()).resolves.toBe('impersonated');
  });

  it('attaches meta/options to handlers (extractHandlers)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: {
          method: async () => 'created',
          meta: { audit: true },
          options: { requiresAdmin: true }
        }
      }) }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create.meta).toEqual({ audit: true });
    expect(registry.post.create.options).toEqual({ requiresAdmin: true });
  });

  it('does not attach meta/options if not present', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'created'
      }) }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create.meta).toBeUndefined();
    expect(registry.post.create.options).toBeUndefined();
  });

  it('warns on duplicate handlers (extractHandlers)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'one'
      }) },
      { default: withNamespace('post', {
        create: async () => 'two'
      }) }
    ];
    extractHandlers(modules, mockContext);
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate handler: post.create'));
  });

  it('injects context and handlers at call time (extractHandlers)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async ({ context, handlers }) => {
          expect(context).toBe(mockContext);
          expect(handlers.post.create).toBeDefined();
          return 'ok';
        }
      }) }
    ];
    const registry = extractHandlers(modules, mockContext);
    await expect(registry.post.create({})).resolves.toBe('ok');
  });

  it('supports cross-namespace handlers (extractHandlers)', async () => {
    const modules = [
      { default: [
        { namespace: 'post', name: 'create', method: async () => 'created' },
        { namespace: 'admin', name: 'impersonate', method: async () => 'impersonated' }
      ] }
    ];
    const registry = extractHandlers(modules, mockContext);
    await expect(registry.post.create()).resolves.toBe('created');
    await expect(registry.admin.impersonate()).resolves.toBe('impersonated');
  });

  // Edge cases for coverage
  it('ignores handlers missing namespace', async () => {
    const modules = [
      { default: [
        { name: 'noNamespace', method: async () => 'fail' },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(registry.noNamespace).toBeUndefined();
  });

  it('ignores handlers missing name', async () => {
    const modules = [
      { default: [
        { namespace: 'post', method: async () => 'fail' },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(Object.keys(registry.post)).toEqual(['create']);
  });

  it('ignores handlers missing method', async () => {
    const modules = [
      { default: [
        { namespace: 'post', name: 'noMethod' },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(registry.post.noMethod).toBeUndefined();
  });

  it('ignores handlers where method is not a function', async () => {
    const modules = [
      { default: [
        { namespace: 'post', name: 'bad', method: 123 },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(registry.post.bad).toBeUndefined();
  });

  it('handles empty modules array', async () => {
    const modules = [];
    const registry = extractHandlers(modules, mockContext);
    expect(registry).toEqual({});
  });

  it('handles module with no default export', async () => {
    const modules = [{ notDefault: true }];
    const registry = extractHandlers(modules, mockContext);
    expect(registry).toEqual({});
  });

  it('loads legacy object-by-namespace with meta/options', async () => {
    const modules = [
      { default: {
        post: {
          create: {
            method: async () => 'created',
            meta: { legacy: true },
            options: { legacy: true }
          }
        }
      } }
    ];
    const registry = extractHandlers(modules, mockContext);
    expect(registry.post.create.meta).toEqual({ legacy: true });
    expect(registry.post.create.options).toEqual({ legacy: true });
    await expect(registry.post.create()).resolves.toBe('created');
  });
}); 