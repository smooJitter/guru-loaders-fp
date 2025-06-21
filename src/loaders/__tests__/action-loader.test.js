import { actionLoader } from '../action-loader/index.js';

describe('action-loader edge/negative cases', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
  const baseContext = () => ({ services: { logger: mockLogger } });

  it('loads actions with meta and options', async () => {
    const modules = [
      { default: () => [
        { namespace: 'foo', name: 'bar', method: async () => 'ok', meta: { audit: true }, options: { admin: true } }
      ] }
    ];
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[0],
      findFiles: () => ['foo.actions.js']
    };
    const { actions } = await actionLoader(ctx);
    expect(actions.foo.bar).toBeInstanceOf(Function);
    expect(actions.foo.bar.meta).toEqual({ audit: true });
    expect(actions.foo.bar.options).toEqual({ admin: true });
    await expect(actions.foo.bar({})).resolves.toBe('ok');
  });

  it('loads multiple namespaces from one file', async () => {
    const modules = [
      { default: () => [
        { namespace: 'foo', name: 'a', method: async () => 'A' },
        { namespace: 'bar', name: 'b', method: async () => 'B' }
      ] }
    ];
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[0],
      findFiles: () => ['multi.actions.js']
    };
    const { actions } = await actionLoader(ctx);
    expect(actions.foo.a).toBeInstanceOf(Function);
    expect(actions.bar.b).toBeInstanceOf(Function);
    await expect(actions.foo.a({})).resolves.toBe('A');
    await expect(actions.bar.b({})).resolves.toBe('B');
  });

  it('handles factory that throws error', async () => {
    const modules = [
      { default: () => { throw new Error('Factory failed'); } }
    ];
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[0],
      findFiles: () => ['fail.actions.js']
    };
    await expect(actionLoader(ctx)).resolves.toHaveProperty('actions');
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 