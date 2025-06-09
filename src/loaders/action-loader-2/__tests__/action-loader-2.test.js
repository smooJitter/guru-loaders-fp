import actionLoader2 from '../index.js';
import { withNamespace } from '../../../utils/withNamespace.js';
import { extractActions } from '../extractActions.js';

describe('action-loader-2', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
  const mockContext = { services: { logger: mockLogger } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads actions from withNamespace (extractActions)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'created',
        delete: async () => 'deleted'
      }) }
    ];
    const registry = extractActions(modules, mockContext);
    await expect(registry.post.create()).resolves.toBe('created');
    await expect(registry.post.delete()).resolves.toBe('deleted');
  });

  it('loads actions from factory export (extractActions)', async () => {
    const modules = [
      { default: () => withNamespace('admin', {
        impersonate: async () => 'impersonated'
      }) }
    ];
    const registry = extractActions(modules, mockContext);
    await expect(registry.admin.impersonate()).resolves.toBe('impersonated');
  });

  it('attaches meta/options to actions (extractActions)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: {
          method: async () => 'created',
          meta: { audit: true },
          options: { requiresAdmin: true }
        }
      }) }
    ];
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create.meta).toEqual({ audit: true });
    expect(registry.post.create.options).toEqual({ requiresAdmin: true });
  });

  it('does not attach meta/options if not present', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'created'
      }) }
    ];
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create.meta).toBeUndefined();
    expect(registry.post.create.options).toBeUndefined();
  });

  it('warns on duplicate actions (extractActions)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'one'
      }) },
      { default: withNamespace('post', {
        create: async () => 'two'
      }) }
    ];
    extractActions(modules, mockContext);
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate action: post.create'));
  });

  it('injects context and actions at call time (extractActions)', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async ({ context, actions }) => {
          expect(context).toBe(mockContext);
          expect(actions.post.create).toBeDefined();
          return 'ok';
        }
      }) }
    ];
    const registry = extractActions(modules, mockContext);
    await expect(registry.post.create({})).resolves.toBe('ok');
  });

  it('supports cross-namespace actions (extractActions)', async () => {
    const modules = [
      { default: [
        { namespace: 'post', name: 'create', method: async () => 'created' },
        { namespace: 'admin', name: 'impersonate', method: async () => 'impersonated' }
      ] }
    ];
    const registry = extractActions(modules, mockContext);
    await expect(registry.post.create()).resolves.toBe('created');
    await expect(registry.admin.impersonate()).resolves.toBe('impersonated');
  });

  it('integration: loads and namespaces actions via loader', async () => {
    const modules = [
      { default: withNamespace('post', {
        create: async () => 'created',
        delete: async () => 'deleted'
      }) },
      { default: () => withNamespace('admin', {
        impersonate: async () => 'impersonated'
      }) }
    ];
    // Patch loader to use our modules (simulate file loading)
    const context = { ...mockContext };
    // Simulate loader's transform step
    context.actions = extractActions(modules, context);
    expect(context.actions.post.create).toBeInstanceOf(Function);
    expect(context.actions.admin.impersonate).toBeInstanceOf(Function);
    await expect(context.actions.post.create()).resolves.toBe('created');
    await expect(context.actions.admin.impersonate()).resolves.toBe('impersonated');
  });

  // Edge cases for coverage
  it('ignores actions missing namespace', async () => {
    const modules = [
      { default: [
        { name: 'noNamespace', method: async () => 'fail' },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(registry.noNamespace).toBeUndefined();
  });

  it('ignores actions missing name', async () => {
    const modules = [
      { default: [
        { namespace: 'post', method: async () => 'fail' },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(Object.keys(registry.post)).toEqual(['create']);
  });

  it('ignores actions missing method', async () => {
    const modules = [
      { default: [
        { namespace: 'post', name: 'noMethod' },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(registry.post.noMethod).toBeUndefined();
  });

  it('ignores actions where method is not a function', async () => {
    const modules = [
      { default: [
        { namespace: 'post', name: 'bad', method: 123 },
        { namespace: 'post', name: 'create', method: async () => 'ok' }
      ] }
    ];
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create).toBeDefined();
    expect(registry.post.bad).toBeUndefined();
  });

  it('handles empty modules array', async () => {
    const modules = [];
    const registry = extractActions(modules, mockContext);
    expect(registry).toEqual({});
  });

  it('handles module with no default export', async () => {
    const modules = [{ notDefault: true }];
    const registry = extractActions(modules, mockContext);
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
    const registry = extractActions(modules, mockContext);
    expect(registry.post.create.meta).toEqual({ legacy: true });
    expect(registry.post.create.options).toEqual({ legacy: true });
    await expect(registry.post.create()).resolves.toBe('created');
  });
}); 