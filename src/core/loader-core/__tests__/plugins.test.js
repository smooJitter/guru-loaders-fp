import {
  withPlugins,
  withMiddleware,
  withValidation,
  composePlugins,
  filterPlugins,
  loggingPlugin,
  asyncLoggingPlugin
} from '../plugins.js';
import { beforePlugin, afterPlugin } from './lib/mockPlugins.js';
import { mockContext } from './lib/mockContext.js';

describe('plugins.js', () => {
  it('withPlugins applies before and after hooks (sync)', async () => {
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withPlugins([beforePlugin, afterPlugin])(loader);
    const result = await wrapped(mockContext());
    expect(result.before).toBe(true);
    expect(result.after).toBe(true);
    expect(result.loaded).toBe(true);
  });

  it('withPlugins applies async before/after hooks', async () => {
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withPlugins([asyncLoggingPlugin])(loader);
    const result = await wrapped(mockContext());
    expect(result.loaded).toBe(true);
    // No assertion for console.log, just ensure no error
  });

  it('withPlugins composes multiple plugins in order', async () => {
    const order = [];
    const pluginA = { before: ctx => { order.push('A-before'); return ctx; }, after: ctx => { order.push('A-after'); return ctx; } };
    const pluginB = { before: ctx => { order.push('B-before'); return ctx; }, after: ctx => { order.push('B-after'); return ctx; } };
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withPlugins([pluginA, pluginB])(loader);
    await wrapped(mockContext());
    expect(order).toEqual(['A-before', 'B-before', 'A-after', 'B-after']);
  });

  it('withMiddleware applies middleware before loader', async () => {
    const mw1 = ctx => ({ ...ctx, mw1: true });
    const mw2 = ctx => ({ ...ctx, mw2: true });
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withMiddleware([mw1, mw2])(loader);
    const result = await wrapped(mockContext());
    expect(result.mw1).toBe(true);
    expect(result.mw2).toBe(true);
    expect(result.loaded).toBe(true);
  });

  it('withValidation runs validators and throws on error', async () => {
    const validator = ctx => { if (!ctx.user) throw new Error('No user'); };
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withValidation([validator])(loader);
    await expect(wrapped(mockContext())).resolves.toHaveProperty('loaded', true);
    const badContext = mockContext({ user: undefined });
    await expect(wrapped(badContext)).rejects.toThrow('No user');
  });

  it('composePlugins flattens and dedupes plugin arrays', () => {
    const pluginA = { name: 'A' };
    const pluginB = { name: 'B' };
    const arr1 = [pluginA, pluginB];
    const arr2 = [pluginA];
    const result = composePlugins(arr1, arr2);
    expect(result).toEqual([pluginA, pluginB]);
  });

  it('filterPlugins filters plugins by predicate', () => {
    const pluginA = { name: 'A' };
    const pluginB = { name: 'B' };
    const plugins = [pluginA, pluginB];
    const filtered = filterPlugins(plugins, p => p.name === 'A');
    expect(filtered).toEqual([pluginA]);
  });

  it('withPlugins propagates errors from plugins', async () => {
    const errorPlugin = { before: () => { throw new Error('fail before'); } };
    const loader = ctx => ctx;
    const wrapped = withPlugins([errorPlugin])(loader);
    await expect(wrapped(mockContext())).rejects.toThrow('fail before');
  });

  it('withValidation ignores non-function validators', async () => {
    const validator = ctx => { if (!ctx.user) throw new Error('No user'); };
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withValidation([validator, null, undefined, 42])(loader);
    await expect(wrapped(mockContext())).resolves.toHaveProperty('loaded', true);
  });

  it('withPlugins ignores plugins with no before/after', async () => {
    const noopPlugin = {};
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withPlugins([noopPlugin])(loader);
    const result = await wrapped(mockContext());
    expect(result.loaded).toBe(true);
  });

  it('withMiddleware ignores non-function middleware', async () => {
    const mw1 = ctx => ({ ...ctx, mw1: true });
    const loader = ctx => ({ ...ctx, loaded: true });
    const wrapped = withMiddleware([mw1, null, undefined, 42])(loader);
    const result = await wrapped(mockContext());
    expect(result.mw1).toBe(true);
    expect(result.loaded).toBe(true);
  });
}); 