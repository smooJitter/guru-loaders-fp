import { createAsyncLoader } from '../loader-async.js';
import { buildFlatRegistryByName } from '../lib/registry-builders.js';
import { mockContext } from './lib/mockContext.js';
import { flatModules, flatRegistry } from './lib/registryMocks.js';

// Async mocks for use in async loader tests
const asyncMockFindFiles = files => async () => files;
const asyncMockImportAndApplyAll = modules => async () => modules;

describe('loader-async.js', () => {
  it('should build a flat registry from files (happy path)', async () => {
    const loader = createAsyncLoader('test', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: asyncMockImportAndApplyAll(flatModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = await loader(mockContext());
    expect(context.test).toEqual(flatRegistry);
  });

  it('should handle empty modules (edge case)', async () => {
    const loader = createAsyncLoader('test', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles([]),
      importAndApplyAll: asyncMockImportAndApplyAll([]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = await loader(mockContext());
    expect(context.test).toEqual({});
  });

  it('should reject invalid modules (failure case)', async () => {
    const invalidModules = [{ notName: true }];
    const loader = createAsyncLoader('test', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['bad.js']),
      importAndApplyAll: asyncMockImportAndApplyAll(invalidModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = await loader(mockContext());
    expect(context.test).toEqual({});
  });

  it('should compose with another async loader (composability)', async () => {
    const loaderA = createAsyncLoader('a', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['a.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'a', value: 1 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'a',
    });
    const loaderB = createAsyncLoader('b', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['b.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'b', value: 2 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'b',
    });
    const contextA = await loaderA(mockContext());
    const contextB = await loaderB(contextA);
    expect(contextB.a).toEqual({ a: { name: 'a', value: 1 } });
    expect(contextB.b).toEqual({ b: { name: 'b', value: 2 } });
  });

  it('should log and throw if validate throws (error handling)', async () => {
    const logger = { error: jest.fn() };
    const throwingValidate = () => { throw new Error('Validation failed'); };
    const loader = createAsyncLoader('test', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['bad.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'bad' }]),
      registryBuilder: buildFlatRegistryByName,
      validate: throwingValidate,
      contextKey: 'test',
    });
    const context = mockContext({ services: { logger } });
    await expect(loader(context)).rejects.toThrow('Validation failed');
  });

  it('should log and throw if registryBuilder throws (error handling)', async () => {
    const logger = { error: jest.fn() };
    const throwingRegistryBuilder = () => { throw new Error('Registry build failed'); };
    const loader = createAsyncLoader('test', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['bad.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'bad' }]),
      registryBuilder: throwingRegistryBuilder,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = mockContext({ services: { logger } });
    await expect(loader(context)).rejects.toThrow('Registry build failed');
  });
}); 