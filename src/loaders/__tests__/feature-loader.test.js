import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createFeatureLoader } from '../feature-loader/feature-loader.js';

const mockFeatureFactoryA = jest.fn(async (ctx) => ({
  typeComposers: { FooTC: { value: 1 } },
  queries: { fooQuery: () => 1 },
  mutations: {},
  resolvers: {}
}));
const mockFeatureFactoryB = jest.fn(async (ctx) => ({
  typeComposers: { BarTC: { value: 2 } },
  queries: {},
  mutations: { barMutation: () => 2 },
  resolvers: {}
}));
const mockErrorFactory = jest.fn(async () => { throw new Error('fail'); });

const baseContext = () => ({
  typeComposers: {},
  queries: {},
  mutations: {},
  resolvers: {},
});

describe('featureLoader (modern QA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeLoader = (files, factoryMap) => createFeatureLoader({
    findFiles: () => files,
    importAndApplyAll: async (files, ctx) => {
      const manifests = [];
      for (const file of files) {
        const fn = factoryMap[file];
        if (typeof fn === 'function') {
          try {
            const manifest = await fn(ctx);
            if (manifest) manifests.push(manifest);
          } catch (err) {
            // Swallow error for robust loader
          }
        }
      }
      return manifests;
    }
  });

  it('merges all feature registries (happy path)', async () => {
    const files = ['features/foo/index.js', 'features/bar/index.js'];
    const factoryMap = {
      'features/foo/index.js': mockFeatureFactoryA,
      'features/bar/index.js': mockFeatureFactoryB,
    };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers.FooTC).toEqual({ value: 1 });
    expect(ctx.typeComposers.BarTC).toEqual({ value: 2 });
    expect(ctx.queries.fooQuery()).toBe(1);
    expect(ctx.mutations.barMutation()).toBe(2);
    expect(mockFeatureFactoryA).toHaveBeenCalled();
    expect(mockFeatureFactoryB).toHaveBeenCalled();
  });

  it('handles no features found (edge case)', async () => {
    const files = [];
    const factoryMap = {};
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(Object.keys(ctx.typeComposers)).toEqual([]);
    expect(Object.keys(ctx.queries)).toEqual([]);
    expect(Object.keys(ctx.mutations)).toEqual([]);
    expect(Object.keys(ctx.resolvers)).toEqual([]);
  });

  it('swallows errors from feature factories (robust)', async () => {
    const files = ['features/foo/index.js', 'features/bad/index.js'];
    const factoryMap = {
      'features/foo/index.js': mockFeatureFactoryA,
      'features/bad/index.js': mockErrorFactory,
    };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers.FooTC).toEqual({ value: 1 });
    expect(ctx.typeComposers.BarTC).toBeUndefined();
    expect(mockFeatureFactoryA).toHaveBeenCalled();
    expect(mockErrorFactory).toHaveBeenCalled();
  });

  it('merges duplicate keys with last-wins (QA)', async () => {
    const files = ['features/foo/index.js', 'features/dupe/index.js'];
    const factoryMap = {
      'features/foo/index.js': async () => ({ typeComposers: { FooTC: { value: 1 } } }),
      'features/dupe/index.js': async () => ({ typeComposers: { FooTC: { value: 99 } } }),
    };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers.FooTC).toEqual({ value: 99 });
  });
}); 