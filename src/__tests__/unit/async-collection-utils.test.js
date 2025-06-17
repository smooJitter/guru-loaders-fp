import { describe, it, expect, jest } from '@jest/globals';
import {
  mapAsync,
  filterAsync,
  reduceAsync,
  forEachAsync,
  someAsync,
  everyAsync,
  findAsync,
  findIndexAsync
} from '../../utils/async-collection-utils.js';

describe('async-collection-utils', () => {
  describe('mapAsync', () => {
    it('maps over array with async function', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x * 2);
      const result = await mapAsync(fn, arr);
      expect(result).toEqual([2, 4, 6]);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      const result = await mapAsync(fn, []);
      expect(result).toEqual([]);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in mapper function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('Mapping error');
      const fn = jest.fn(async () => { throw error; });
      await expect(mapAsync(fn, arr)).rejects.toThrow(error);
    });
  });

  describe('filterAsync', () => {
    it('filters array with async predicate', async () => {
      const arr = [1, 2, 3, 4];
      const fn = jest.fn(async x => x % 2 === 0);
      const result = await filterAsync(fn, arr);
      expect(result).toEqual([2, 4]);
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      const result = await filterAsync(fn, []);
      expect(result).toEqual([]);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in predicate function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('Filter error');
      const fn = jest.fn(async () => { throw error; });
      await expect(filterAsync(fn, arr)).rejects.toThrow(error);
    });
  });

  describe('reduceAsync', () => {
    it('reduces array with async function', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async (acc, x) => acc + x);
      const result = await reduceAsync(fn, 0, arr);
      expect(result).toBe(6);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async (acc, x) => acc + x);
      const result = await reduceAsync(fn, 0, []);
      expect(result).toBe(0);
      expect(fn).not.toHaveBeenCalled();
    });

    it('uses first element as initial value when not provided', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async (acc, x) => acc + x);
      const result = await reduceAsync(fn, undefined, arr);
      expect(result).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('handles errors in reducer function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('Reduce error');
      const fn = jest.fn(async () => { throw error; });
      await expect(reduceAsync(fn, 0, arr)).rejects.toThrow(error);
    });
  });

  describe('forEachAsync', () => {
    it('executes async function for each element', async () => {
      const arr = [1, 2, 3];
      const results = [];
      const fn = jest.fn(async x => results.push(x * 2));
      await forEachAsync(fn, arr);
      expect(results).toEqual([2, 4, 6]);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      await forEachAsync(fn, []);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in callback function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('ForEach error');
      const fn = jest.fn(async () => { throw error; });
      await expect(forEachAsync(fn, arr)).rejects.toThrow(error);
    });
  });

  describe('someAsync', () => {
    it('returns true if any element matches predicate', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x === 2);
      const result = await someAsync(fn, arr);
      expect(result).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('returns false if no element matches predicate', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x > 3);
      const result = await someAsync(fn, arr);
      expect(result).toBe(false);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      const result = await someAsync(fn, []);
      expect(result).toBe(false);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in predicate function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('Some error');
      const fn = jest.fn(async () => { throw error; });
      await expect(someAsync(fn, arr)).rejects.toThrow(error);
    });
  });

  describe('everyAsync', () => {
    it('returns true if all elements match predicate', async () => {
      const arr = [2, 4, 6];
      const fn = jest.fn(async x => x % 2 === 0);
      const result = await everyAsync(fn, arr);
      expect(result).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('returns false if any element fails predicate', async () => {
      const arr = [2, 3, 4];
      const fn = jest.fn(async x => x % 2 === 0);
      const result = await everyAsync(fn, arr);
      expect(result).toBe(false);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      const result = await everyAsync(fn, []);
      expect(result).toBe(true);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in predicate function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('Every error');
      const fn = jest.fn(async () => { throw error; });
      await expect(everyAsync(fn, arr)).rejects.toThrow(error);
    });
  });

  describe('findAsync', () => {
    it('returns first element matching predicate', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x === 2);
      const result = await findAsync(fn, arr);
      expect(result).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('returns undefined if no element matches predicate', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x > 3);
      const result = await findAsync(fn, arr);
      expect(result).toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      const result = await findAsync(fn, []);
      expect(result).toBeUndefined();
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in predicate function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('Find error');
      const fn = jest.fn(async () => { throw error; });
      await expect(findAsync(fn, arr)).rejects.toThrow(error);
    });
  });

  describe('findIndexAsync', () => {
    it('returns index of first element matching predicate', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x === 2);
      const result = await findIndexAsync(fn, arr);
      expect(result).toBe(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('returns -1 if no element matches predicate', async () => {
      const arr = [1, 2, 3];
      const fn = jest.fn(async x => x > 3);
      const result = await findIndexAsync(fn, arr);
      expect(result).toBe(-1);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      const fn = jest.fn(async x => x);
      const result = await findIndexAsync(fn, []);
      expect(result).toBe(-1);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles errors in predicate function', async () => {
      const arr = [1, 2, 3];
      const error = new Error('FindIndex error');
      const fn = jest.fn(async () => { throw error; });
      await expect(findIndexAsync(fn, arr)).rejects.toThrow(error);
    });
  });
}); 