import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { modelLoader } from '../model-loader.js';
import { extractModel, lifecycleHook } from '../model-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockMongooseConnection = { connection: 'mock', models: {}, model: jest.fn((name, schema) => ({ modelName: name, schema, find: jest.fn() })) };
const mockContext = { logger: mockLogger, services: { logger: mockLogger }, mongooseConnection: mockMongooseConnection };

// Happy path: model as direct object
const validModel = { modelName: 'TestModel', schema: { foo: 'bar' } };
// Happy path: model as factory function
const validModelFactory = jest.fn(() => ({ modelName: 'User', schema: { foo: 'bar' }, find: jest.fn() }));
// Edge: invalid model (missing modelName)
const invalidModel = { schema: { foo: 'bar' } };
// Failure: not an object or function
const invalidExport = 42;

// Factory function that throws
const throwingFactory = jest.fn(() => { throw new Error('Factory error'); });

// Model with duplicate name
const duplicateModelA = { modelName: 'DupModel', schema: { a: 1 } };
const duplicateModelB = { modelName: 'DupModel', schema: { b: 2 } };

const baseContext = () => ({
  models: {},
  services: {},
  config: {},
  logger: mockLogger,
  mongooseConnection: mockMongooseConnection
});

// Edge: duplicate name factories
const duplicateModelFactoryA = jest.fn(() => ({ modelName: 'dupe', schema: { a: 1 }, find: jest.fn() }));
const duplicateModelFactoryB = jest.fn(() => ({ modelName: 'dupe', schema: { b: 2 }, find: jest.fn() }));

// Failure: invalid model (missing name)
const invalidModelFactory = jest.fn(() => ({ schema: { foo: 'bar' } }));
// Failure: invalid model (not an object)
const invalidTypeModelFactory = jest.fn(() => 42);

describe('modelLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid model object from a factory (happy path)', async () => {
    const files = ['User.model.js'];
    const modules = { 'User.model.js': { default: validModelFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeDefined();
    expect(typeof result.models.User.find).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate model names (edge case)', async () => {
    const files = ['dupeA.model.js', 'dupeB.model.js'];
    const modules = {
      'dupeA.model.js': { default: duplicateModelFactoryA },
      'dupeB.model.js': { default: duplicateModelFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await modelLoader(ctx);
    expect(result.models.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid model objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.model.js'];
    const modules = { 'bad.model.js': { default: invalidModelFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid model objects (not an object) and does not register them (failure)', async () => {
    const files = ['badtype.model.js'];
    const modules = { 'badtype.model.js': { default: invalidTypeModelFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.model.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});

describe('extractModel', () => {
  it('returns undefined for null module', () => {
    expect(extractModel(null)).toBeUndefined();
  });
  it('returns undefined for non-object module', () => {
    expect(extractModel(42)).toBeUndefined();
  });
  it('returns undefined for module.default not a function or object', () => {
    expect(extractModel({ default: 42 })).toBeUndefined();
  });
  it('returns undefined if model is falsy', () => {
    expect(extractModel({ default: undefined })).toBeUndefined();
  });
  it('returns undefined if model is missing modelName', () => {
    expect(extractModel({ default: { schema: {} } })).toBeUndefined();
  });
  it('logs warning if extractModel throws', async () => {
    const files = ['throw.model.js'];
    const modules = { 'throw.model.js': { default: throwingFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    await modelLoader(ctx);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[model-loader]', expect.stringContaining('Error extracting model from file: throw.model.js: Factory error')
    );
  });
  it('logs warning if lifecycleHook throws', async () => {
    const files = ['User.model.js'];
    const modules = { 'User.model.js': { default: validModelFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const originalLifecycleHook = lifecycleHook;
    // Patch lifecycleHook to throw
    require('../model-loader.js').lifecycleHook = async () => { throw new Error('lifecycle fail'); };
    await modelLoader(ctx);
    expect(mockLogger.warn).toHaveBeenCalled();
    require('../model-loader.js').lifecycleHook = originalLifecycleHook;
  });
});

describe('modelLoader edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('works with missing mongooseConnection (uses default)', async () => {
    const files = ['User.model.js'];
    const modules = { 'User.model.js': { default: validModelFactory } };
    const ctx = { services: { logger: mockLogger }, options: {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    } };
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeDefined();
  });
  it('works with missing options.patterns (uses default)', async () => {
    const files = ['User.model.js'];
    const modules = { 'User.model.js': { default: validModelFactory } };
    const ctx = { services: { logger: mockLogger }, mongooseConnection: mockMongooseConnection, options: {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    } };
    delete ctx.options.patterns;
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeDefined();
  });
  it('works with missing options.findFiles (uses default)', async () => {
    const ctx = { services: { logger: mockLogger }, mongooseConnection: mockMongooseConnection, options: {} };
    // Should not throw
    await modelLoader(ctx);
  });
  it('works with missing options.importModule (uses default)', async () => {
    const ctx = { services: { logger: mockLogger }, mongooseConnection: mockMongooseConnection, options: {} };
    // Should not throw
    await modelLoader(ctx);
  });
}); 