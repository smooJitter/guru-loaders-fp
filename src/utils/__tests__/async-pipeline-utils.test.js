import { describe, it, expect } from '@jest/globals';
import { pipeAsync, composeAsync, safePipeAsync, safeComposeAsync, tapAsync } from '../async-pipeline-utils.js';

describe('pipeAsync', () => {
  it('pipes async functions (happy path)', async () => {
    const add = async x => x + 1;
    const double = async x => x * 2;
    const pipeline = pipeAsync(add, double);
    const result = await pipeline(2);
    expect(result).toBe(6);
  });

  it('handles empty pipeline (edge case)', async () => {
    const pipeline = pipeAsync();
    const result = await pipeline(5);
    expect(result).toBe(5);
  });

  it('handles non-async functions', async () => {
    const add = x => x + 1;
    const double = x => x * 2;
    const pipeline = pipeAsync(add, double);
    const result = await pipeline(2);
    expect(result).toBe(6);
  });

  it('propagates errors', async () => {
    const fail = async () => { throw new Error('pipe fail'); };
    const pipeline = pipeAsync(fail);
    await expect(pipeline(1)).rejects.toThrow('pipe fail');
  });
});

describe('composeAsync', () => {
  it('composes async functions in reverse order', async () => {
    const add = async x => x + 1;
    const double = async x => x * 2;
    const composed = composeAsync(double, add);
    const result = await composed(2);
    expect(result).toBe(6);
  });

  it('handles empty composition', async () => {
    const composed = composeAsync();
    const result = await composed(5);
    expect(result).toBe(5);
  });

  it('handles non-async functions', async () => {
    const add = x => x + 1;
    const double = x => x * 2;
    const composed = composeAsync(double, add);
    const result = await composed(2);
    expect(result).toBe(6);
  });

  it('propagates errors', async () => {
    const fail = async () => { throw new Error('compose fail'); };
    const composed = composeAsync(fail);
    await expect(composed(1)).rejects.toThrow('compose fail');
  });
});

describe('safePipeAsync', () => {
  it('returns result on success', async () => {
    const add = async x => x + 1;
    const safe = safePipeAsync(add);
    const result = await safe(1);
    expect(result).toBe(2);
  });

  it('throws error on failure', async () => {
    const fail = async () => { throw new Error('fail'); };
    const safe = safePipeAsync(fail);
    await expect(safe(1)).rejects.toThrow('fail');
  });

  it('handles multiple functions', async () => {
    const add = async x => x + 1;
    const double = async x => x * 2;
    const safe = safePipeAsync(add, double);
    const result = await safe(2);
    expect(result).toBe(6);
  });
});

describe('safeComposeAsync', () => {
  it('returns result on success', async () => {
    const add = async x => x + 1;
    const double = async x => x * 2;
    const safe = safeComposeAsync(double, add);
    const result = await safe(2);
    expect(result).toBe(6);
  });

  it('throws error on failure', async () => {
    const fail = async () => { throw new Error('safe compose fail'); };
    const safe = safeComposeAsync(fail);
    await expect(safe(1)).rejects.toThrow('safe compose fail');
  });

  it('handles empty composition', async () => {
    const safe = safeComposeAsync();
    const result = await safe(5);
    expect(result).toBe(5);
  });
});

describe('tapAsync', () => {
  it('returns original value after side effect', async () => {
    let sideEffect = 0;
    const tap = tapAsync(async x => { sideEffect = x; });
    const result = await tap(5);
    expect(result).toBe(5);
    expect(sideEffect).toBe(5);
  });

  it('propagates errors from side effect', async () => {
    const tap = tapAsync(async () => { throw new Error('tap fail'); });
    await expect(tap(5)).rejects.toThrow('tap fail');
  });

  it('works in pipeline', async () => {
    let sideEffect = 0;
    const add = async x => x + 1;
    const tap = tapAsync(async x => { sideEffect = x; });
    const pipeline = pipeAsync(add, tap, add);
    const result = await pipeline(1);
    expect(result).toBe(3);
    expect(sideEffect).toBe(2);
  });
}); 