import { describe, it, expect } from '@jest/globals';
import * as utils from '../async-collection-utils.js';

describe('mapAsync', () => {
  it('maps over array asynchronously', async () => {
    const result = await utils.mapAsync(async x => x * 2)([1, 2, 3]);
    expect(result).toEqual([2, 4, 6]);
  });
  it('returns empty array for empty input', async () => {
    const result = await utils.mapAsync(async x => x * 2)([]);
    expect(result).toEqual([]);
  });
  it('returns empty array for non-array input', async () => {
    const result = await utils.mapAsync(async x => x * 2)(null);
    expect(result).toEqual([]);
  });
  it('propagates error if function throws', async () => {
    await expect(utils.mapAsync(async () => { throw new Error('fail'); })([1])).rejects.toThrow('fail');
  });
});

describe('filterAsync', () => {
  it('filters array asynchronously', async () => {
    const result = await utils.filterAsync(async x => x > 1)([1, 2, 3]);
    expect(result).toEqual([2, 3]);
  });
  it('returns empty array for empty input', async () => {
    const result = await utils.filterAsync(async x => x > 1)([]);
    expect(result).toEqual([]);
  });
  it('returns empty array for non-array input', async () => {
    const result = await utils.filterAsync(async x => x > 1)(null);
    expect(result).toEqual([]);
  });
  it('propagates error if function throws', async () => {
    await expect(utils.filterAsync(async () => { throw new Error('fail'); })([1])).rejects.toThrow('fail');
  });
});

describe('groupByAsync', () => {
  it('groups array asynchronously', async () => {
    const result = await utils.groupByAsync(async x => x % 2 === 0 ? 'even' : 'odd')([1, 2, 3]);
    expect(result).toEqual({ odd: [1, 3], even: [2] });
  });
  it('returns empty object for empty input', async () => {
    const result = await utils.groupByAsync(async x => x)([]);
    expect(result).toEqual({});
  });
  it('returns empty object for non-array input', async () => {
    const result = await utils.groupByAsync(async x => x)(null);
    expect(result).toEqual({});
  });
  it('propagates error if function throws', async () => {
    await expect(utils.groupByAsync(async () => { throw new Error('fail'); })([1])).rejects.toThrow('fail');
  });
});

describe('reduceAsync', () => {
  it('reduces async over array (happy path)', async () => {
    const result = await utils.reduceAsync(async (acc, x) => acc + x, 0)([1, 2, 3]);
    expect(result).toBe(6);
  });

  it('handles empty array (edge case)', async () => {
    const result = await utils.reduceAsync(async (acc, x) => acc + x, 0)([]);
    expect(result).toBe(0);
  });
});

describe('mapAsync (concurrency)', () => {
  it('respects concurrency limit', async () => {
    const start = Date.now();
    const delays = [50, 50, 50, 50];
    const fn = async (x) => {
      await new Promise(res => setTimeout(res, delays[x]));
      return x;
    };
    // With concurrency=2, total time should be about 100ms (2 batches of 2)
    const result = await utils.mapAsync(fn, { concurrency: 2 })([0, 1, 2, 3]);
    const elapsed = Date.now() - start;
    expect(result).toEqual([0, 1, 2, 3]);
    expect(elapsed).toBeGreaterThanOrEqual(95); // allow for timer slop
    expect(elapsed).toBeLessThan(200); // should not be fully sequential
  });
});

describe('partitionAsync', () => {
  it('partitions array asynchronously', async () => {
    const result = await utils.partitionAsync(async x => x % 2 === 0)([1, 2, 3, 4]);
    expect(result).toEqual([[2, 4], [1, 3]]);
  });
  it('returns [[], []] for empty input', async () => {
    const result = await utils.partitionAsync(async x => x % 2 === 0)([]);
    expect(result).toEqual([[], []]);
  });
  it('returns [[], []] for non-array input', async () => {
    const result = await utils.partitionAsync(async x => x % 2 === 0)(null);
    expect(result).toEqual([[], []]);
  });
  it('propagates error if function throws', async () => {
    await expect(utils.partitionAsync(async () => { throw new Error('fail'); })([1])).rejects.toThrow('fail');
  });
});

describe('sortAsync', () => {
  it('sorts array asynchronously', async () => {
    const result = await utils.sortAsync(async x => 10 - x)([1, 2, 3]);
    expect(result).toEqual([3, 2, 1]);
  });
  it('returns empty array for empty input', async () => {
    const result = await utils.sortAsync(async x => x)([]);
    expect(result).toEqual([]);
  });
  it('returns empty array for non-array input', async () => {
    const result = await utils.sortAsync(async x => x)(null);
    expect(result).toEqual([]);
  });
  it('propagates error if function throws', async () => {
    await expect(utils.sortAsync(async () => { throw new Error('fail'); })([1])).rejects.toThrow('fail');
  });
});

describe('uniqueAsync', () => {
  it('filters unique values asynchronously', async () => {
    const result = await utils.uniqueAsync(async x => x % 2)([1, 2, 3, 4]);
    expect(result).toEqual([1, 2]); // 1%2=1, 2%2=0, 3%2=1 (already seen), 4%2=0 (already seen)
  });
  it('returns empty array for empty input', async () => {
    const result = await utils.uniqueAsync(async x => x)([]);
    expect(result).toEqual([]);
  });
  it('returns empty array for non-array input', async () => {
    const result = await utils.uniqueAsync(async x => x)(null);
    expect(result).toEqual([]);
  });
  it('propagates error if function throws', async () => {
    await expect(utils.uniqueAsync(async () => { throw new Error('fail'); })([1])).rejects.toThrow('fail');
  });
}); 