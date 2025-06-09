import { describe, it, expect } from '@jest/globals';
import { pipeAsync, composeAsync, safePipeAsync } from '../async-pipeline-utils.js';

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
});

describe('composeAsync', () => {
  it('composes async functions in reverse order', async () => {
    const add = async x => x + 1;
    const double = async x => x * 2;
    const composed = composeAsync(double, add);
    const result = await composed(2);
    expect(result).toBe(6);
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
}); 