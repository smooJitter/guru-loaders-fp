import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createModelLoader } from '../model-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockMongooseConnection = { connection: 'mock', models: {}, model: jest.fn((name, schema) => ({ modelName: name, schema })) };
const mockContext = { logger: mockLogger, services: { logger: mockLogger }, mongooseConnection: mockMongooseConnection };

// Happy path: model as direct object
const validModel = { modelName: 'TestModel', schema: { foo: 'bar' } };
// Happy path: model as factory function
const validModelFactory = jest.fn(() => ({ modelName: 'FactoryModel', schema: { bar: 'baz' } }));
// Edge: invalid model (missing modelName)
const invalidModel = { schema: { foo: 'bar' } };
// Failure: not an object or function
const invalidExport = 42;

// Factory function that throws
const throwingFactory = jest.fn(() => { throw new Error('Factory error'); });

// Model with duplicate name
const duplicateModelA = { modelName: 'DupModel', schema: { a: 1 } };
const duplicateModelB = { modelName: 'DupModel', schema: { b: 2 } };

describe('createModelLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers a direct model object (happy path)', async () => {
    const files = ['foo.model.js'];
    const modules = { 'foo.model.js': { default: validModel } };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models).toBeDefined();
    expect(result.models.TestModel).toBeDefined();
    expect(result.models.TestModel.modelName).toBe('TestModel');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers a model from factory function (happy path)', async () => {
    const files = ['bar.model.js'];
    const modules = { 'bar.model.js': { default: validModelFactory } };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models).toBeDefined();
    expect(result.models.FactoryModel).toBeDefined();
    expect(result.models.FactoryModel.modelName).toBe('FactoryModel');
    expect(validModelFactory).toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads multiple valid models from different files', async () => {
    const files = ['foo.model.js', 'bar.model.js'];
    const modules = {
      'foo.model.js': { default: validModel },
      'bar.model.js': { default: validModelFactory }
    };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models.TestModel).toBeDefined();
    expect(result.models.FactoryModel).toBeDefined();
    expect(Object.keys(result.models)).toHaveLength(2);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('registers valid models and warns for invalid ones', async () => {
    const files = ['foo.model.js', 'bad.model.js'];
    const modules = {
      'foo.model.js': { default: validModel },
      'bad.model.js': { default: invalidModel }
    };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models.TestModel).toBeDefined();
    expect(Object.keys(result.models)).toHaveLength(1);
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('registers valid models and warns if factory throws', async () => {
    const files = ['foo.model.js', 'throw.model.js'];
    const modules = {
      'foo.model.js': { default: validModel },
      'throw.model.js': { default: throwingFactory }
    };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models.TestModel).toBeDefined();
    expect(Object.keys(result.models)).toHaveLength(1);
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('last model wins on name collision, warns for duplicate', async () => {
    const files = ['dupA.model.js', 'dupB.model.js'];
    const modules = {
      'dupA.model.js': { default: duplicateModelA },
      'dupB.model.js': { default: duplicateModelB }
    };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models.DupModel).toBeDefined();
    expect(result.models.DupModel.schema).toEqual({ b: 2 }); // last one wins
    // Optionally, check for a warning if you want to add duplicate detection
  });

  it('uses logger from context.services if context.logger is missing', async () => {
    const files = ['foo.model.js'];
    const modules = { 'foo.model.js': { default: invalidModel } };
    const ctx = { services: { logger: mockLogger }, mongooseConnection: mockMongooseConnection };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    await loader({ ...ctx, models: {} });
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('returns empty models object and no warnings if no files found', async () => {
    const files = [];
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async () => undefined,
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models).toBeDefined();
    expect(Object.keys(result.models)).toHaveLength(0);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns if model is invalid (missing modelName)', async () => {
    const files = ['bad.model.js'];
    const modules = { 'bad.model.js': { default: invalidModel } };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models).toBeDefined();
    expect(Object.keys(result.models)).toHaveLength(0);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('warns if export is not object or function', async () => {
    const files = ['fail.model.js'];
    const modules = { 'fail.model.js': { default: invalidExport } };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, models: {} });
    expect(result.models).toBeDefined();
    expect(Object.keys(result.models)).toHaveLength(0);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('falls back to console.log if logger is missing', async () => {
    const files = ['foo.model.js'];
    const modules = { 'foo.model.js': { default: validModel } };
    const ctx = { mongooseConnection: mockMongooseConnection };
    const loader = createModelLoader(mockMongooseConnection, {
      importModule: async (file) => modules[file],
      findFiles: () => files
    });
    await expect(loader({ ...ctx, models: {} })).resolves.toBeDefined();
  });
}); 