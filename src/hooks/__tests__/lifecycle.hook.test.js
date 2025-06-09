import { describe, it, expect } from '@jest/globals';
import { lifecycleHook } from '../lifecycle.hook.js';

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