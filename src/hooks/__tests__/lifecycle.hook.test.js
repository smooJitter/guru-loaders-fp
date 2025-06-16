import { describe, it, expect } from '@jest/globals';
import { lifecycleHook, runLifecycle } from '../lifecycle.hook.js';

describe('lifecycleHook', () => {
  it('runs all lifecycle methods and returns context', async () => {
    const calls = [];
    const methods = [
      async ctx => { calls.push('a'); },
      async ctx => { calls.push('b'); }
    ];
    const context = { foo: 'bar' };
    const result = await lifecycleHook(methods, context);
    expect(calls).toEqual(['a', 'b']);
    expect(result).toBe(context);
  });

  it('skips non-function entries', async () => {
    const calls = [];
    const methods = [null, async ctx => { calls.push('x'); }, 42];
    const context = {};
    await lifecycleHook(methods, context);
    expect(calls).toEqual(['x']);
  });
});

describe('runLifecycle', () => {
  it('runs a single function for event', async () => {
    const calls = [];
    const context = { onFoo: async ctx => { calls.push('single'); } };
    await runLifecycle('foo', context);
    expect(calls).toEqual(['single']);
  });
  it('runs an array of functions for event', async () => {
    const calls = [];
    const context = { onBar: [async ctx => { calls.push('a'); }, async ctx => { calls.push('b'); }] };
    await runLifecycle('bar', context);
    expect(calls).toEqual(['a', 'b']);
  });
  it('skips if no matching handler', async () => {
    const context = {};
    await expect(runLifecycle('baz', context)).resolves.toBeUndefined();
  });
  it('skips non-function entries in array', async () => {
    const calls = [];
    const context = { onQux: [null, async ctx => { calls.push('x'); }, 42] };
    await runLifecycle('qux', context);
    expect(calls).toEqual(['x']);
  });
}); 