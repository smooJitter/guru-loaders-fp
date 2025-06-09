import handlerLoader from '../index.js';
import { withNamespace } from '../../../utils/withNamespace.js';
import { extractHandlers } from '../extractHandlers.js';

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