// model-loader.test.js
// Senior QA: Only core-loader-new tests. Covers global/local registry, cleanup, context purity, multi-connection, error handling.

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import modelLoader from '../model-loader.js';
import mongoose from 'mongoose';
import * as R from 'ramda';

// --- Test Utilities ---
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = (overrides = {}) => ({
  services: { logger: mockLogger },
  mongooseConnection: mongoose,
  ...overrides,
});
const registerModels = (files, connection = mongoose) => {
  return files.map(file => {
    const name = file.replace('.model.js', '');
    return connection.model(name, { fake: true });
  });
};
const assertOnlyLoadedModels = (result, loadedNames, legacyNames = []) => {
  expect(Object.keys(result.loadedModels).sort()).toEqual(loadedNames.sort());
  loadedNames.forEach(name => expect(result.loadedModels[name]).toBeDefined());
  legacyNames.forEach(name => expect(result.loadedModels[name]).toBeUndefined());
  expect(Object.keys(result.models).sort()).toEqual([...loadedNames, ...legacyNames].sort());
};

describe('modelLoader (core-loader-new, senior QA)', () => {
  beforeEach(() => {
    mongoose.models = {};
    mongoose.model = jest.fn((name, schema) => {
      if (!mongoose.models[name]) {
        mongoose.models[name] = { modelName: name, schema, findById: jest.fn() };
      }
      return mongoose.models[name];
    });
    jest.clearAllMocks();
  });

  it('registers only new models in loadedModels, but all in models (global)', async () => {
    mongoose.model('Legacy', { fake: true });
    const files = ['User.model.js', 'Product.model.js'];
    const ctx = baseContext({
      findFiles: () => files,
      importAndApplyAll: async (files, context) => registerModels(files)
    });
    const result = await modelLoader(ctx);
    assertOnlyLoadedModels(result, ['User', 'Product'], ['Legacy']);
  });

  it('cleanup removes only loadedModels, not legacy/global models', async () => {
    mongoose.model('Legacy', { fake: true });
    const files = ['User.model.js'];
    const ctx = baseContext({
      findFiles: () => files,
      importAndApplyAll: async (files, context) => registerModels(files)
    });
    const result = await modelLoader(ctx);
    expect(mongoose.models.User).toBeDefined();
    expect(mongoose.models.Legacy).toBeDefined();
    result.cleanup();
    expect(mongoose.models.User).toBeUndefined();
    expect(mongoose.models.Legacy).toBeDefined();
    expect(() => result.cleanup()).not.toThrow();
  });

  it('returns a new context object and does not mutate the original', async () => {
    const files = ['User.model.js'];
    const ctx = baseContext({
      findFiles: () => files,
      importAndApplyAll: async (files, context) => registerModels(files)
    });
    const originalCtx = { ...ctx };
    const result = await modelLoader(ctx);
    expect(ctx).toEqual(originalCtx);
    expect(result).not.toBe(ctx);
  });

  it('handles empty model files and cleanup is a no-op', async () => {
    const ctx = baseContext({
      findFiles: () => [],
      importAndApplyAll: async () => []
    });
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(result.loadedModels).toEqual({});
    expect(() => result.cleanup()).not.toThrow();
  });

  it('works with missing mongooseConnection (uses default)', async () => {
    const files = ['User.model.js'];
    const ctx = {
      findFiles: () => files,
      importAndApplyAll: async (files, context) => registerModels(files)
    };
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeDefined();
    expect(result.models.User.modelName).toBe('User');
    expect(result.loadedModels.User).toBeDefined();
  });

  it('supports multiple mongoose connections (multi-connection safe)', async () => {
    // Simulate two separate connections
    const connA = { models: {}, model: jest.fn((name, schema) => {
      if (!connA.models[name]) connA.models[name] = { modelName: name, schema, findById: jest.fn() };
      return connA.models[name];
    })};
    const connB = { models: {}, model: jest.fn((name, schema) => {
      if (!connB.models[name]) connB.models[name] = { modelName: name, schema, findById: jest.fn() };
      return connB.models[name];
    })};
    registerModels(['UserA.model.js'], connA);
    registerModels(['UserB.model.js'], connB);
    const ctxA = baseContext({ mongooseConnection: connA, findFiles: () => ['UserA.model.js'], importAndApplyAll: async (files, context) => registerModels(files, connA) });
    const resultA = await modelLoader(ctxA);
    expect(resultA.models.UserA).toBeDefined();
    expect(resultA.loadedModels.UserA).toBeDefined();
    expect(resultA.models.UserB).toBeUndefined();
    const ctxB = baseContext({ mongooseConnection: connB, findFiles: () => ['UserB.model.js'], importAndApplyAll: async (files, context) => registerModels(files, connB) });
    const resultB = await modelLoader(ctxB);
    expect(resultB.models.UserB).toBeDefined();
    expect(resultB.loadedModels.UserB).toBeDefined();
    expect(resultB.models.UserA).toBeUndefined();
  });

  it('is robust to duplicate model names (last one wins in global, only last in loadedModels)', async () => {
    const files = ['User.model.js', 'User.model.js'];
    const ctx = baseContext({
      findFiles: () => files,
      importAndApplyAll: async (files, context) => registerModels(files)
    });
    const result = await modelLoader(ctx);
    expect(Object.keys(result.loadedModels)).toEqual(['User']);
    expect(result.models.User).toBeDefined();
  });

  it('handles importAndApplyAll errors gracefully (no loadedModels, models unchanged)', async () => {
    const ctx = baseContext({
      findFiles: () => ['User.model.js'],
      importAndApplyAll: async () => { throw new Error('fail'); }
    });
    const result = await modelLoader(ctx);
    expect(result.loadedModels).toEqual({});
    expect(result.error).toBeInstanceOf(Error);
    expect(() => result.cleanup()).not.toThrow();
  });

  // Add more edge/error/feature-based tests as needed
}); 