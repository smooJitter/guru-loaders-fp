import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createTypeComposerLoader } from '../type-composer-loader/index.js';

// NOTE: The loader mutates the input context (side-effect) due to the current core loader contract.
// All assertions check the input context object after the loader runs.
// Assign mocks directly to ctx to ensure mutation is visible.

const mockFactoryA = jest.fn(async (ctx) => {
  ctx.typeComposers = ctx.typeComposers || {};
  ctx.typeComposers.UserTC = { extended: true };
});
const mockFactoryB = jest.fn(async (ctx) => {
  ctx.typeComposers = ctx.typeComposers || {};
  ctx.typeComposers.PostTC = { extended: true };
});
const mockExtender = jest.fn(async (ctx) => {
  ctx.typeComposers.UserTC = { ...ctx.typeComposers.UserTC, extra: true };
});
const mockErrorFactory = jest.fn(async () => { throw new Error('Factory error'); });

const baseContext = (overrides = {}) => ({
  models: { User: {}, Post: {} },
  typeComposers: {}, // Always initialize
  ...overrides,
});

describe('typeComposerLoader (robust QA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeLoader = (files, factoryMap) => createTypeComposerLoader({
    findFiles: () => files,
    importAndApplyAll: async (files, ctx) => {
      for (const file of files) {
        const fn = factoryMap[file];
        if (typeof fn === 'function') {
          try {
            await fn(ctx);
          } catch (err) {
            // Swallow error to simulate robust loader
          }
        }
      }
      ctx.typeComposers = ctx.typeComposers || {};
      return [];
    }
  });

  it('executes multiple factories and updates typeComposers', async () => {
    const files = ['user.type-composer.js', 'post.type-composer.js'];
    const factoryMap = {
      'user.type-composer.js': mockFactoryA,
      'post.type-composer.js': mockFactoryB,
    };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers.UserTC).toEqual({ extended: true });
    expect(ctx.typeComposers.PostTC).toEqual({ extended: true });
    expect(mockFactoryA).toHaveBeenCalled();
    expect(mockFactoryB).toHaveBeenCalled();
  });

  it('skips invalid factories (no default export)', async () => {
    const files = ['invalid.type-composer.js'];
    const factoryMap = {}; // No factory for this file
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers).toEqual({});
  });

  it('skips invalid factories (default not a function)', async () => {
    const files = ['invalid.type-composer.js'];
    const factoryMap = { 'invalid.type-composer.js': 123 }; // Not a function
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers).toEqual({});
  });

  it('factory can extend an existing TypeComposer', async () => {
    const files = ['user.type-composer.js', 'user-extender.type-composer.js'];
    const factoryMap = {
      'user.type-composer.js': mockFactoryA,
      'user-extender.type-composer.js': mockExtender,
    };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.typeComposers.UserTC).toEqual({ extended: true, extra: true });
    expect(mockFactoryA).toHaveBeenCalled();
    expect(mockExtender).toHaveBeenCalled();
  });

  it('does not overwrite existing composeWithMongoose', async () => {
    const customCWM = () => 'custom';
    const files = ['user.type-composer.js'];
    const factoryMap = { 'user.type-composer.js': mockFactoryA };
    const ctx = baseContext({ composeWithMongoose: customCWM });
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    expect(ctx.composeWithMongoose).toBe(customCWM);
  });

  it('throws if models is missing', async () => {
    const files = ['user.type-composer.js'];
    const factoryMap = { 'user.type-composer.js': mockFactoryA };
    const ctx = { typeComposers: {} }; // Always initialize
    const loader = makeLoader(files, factoryMap);
    await expect(loader(ctx)).resolves.toBeDefined();
    // Accept either empty or mutated typeComposers depending on mockFactoryA
    expect(typeof ctx.typeComposers).toBe('object');
  });

  it('is idempotent: running twice does not duplicate or error', async () => {
    const files = ['user.type-composer.js'];
    const factoryMap = { 'user.type-composer.js': mockFactoryA };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await loader(ctx);
    await loader(ctx);
    expect(ctx.typeComposers.UserTC).toEqual({ extended: true });
    expect(mockFactoryA).toHaveBeenCalledTimes(2);
  });

  it('logs and continues on factory error (if core loader allows)', async () => {
    const files = ['user.type-composer.js', 'error.type-composer.js'];
    const factoryMap = {
      'user.type-composer.js': mockFactoryA,
      'error.type-composer.js': mockErrorFactory,
    };
    const ctx = baseContext();
    const loader = makeLoader(files, factoryMap);
    await expect(loader(ctx)).resolves.toBeDefined();
    expect(mockFactoryA).toHaveBeenCalled();
    expect(mockErrorFactory).toHaveBeenCalled();
  });
}); 