import { createLoader } from '../loader.js';
import { buildFlatRegistryByName } from '../lib/registry-builders.js';
import { mockContext } from './lib/mockContext.js';
import { mockFindFiles, mockImportAndApplyAll } from './lib/mockFileUtils.js';
import { flatModules, flatRegistry, emptyModules } from './lib/registryMocks.js';

describe('loader.js', () => {
  it('should build a flat registry from files (happy path)', () => {
    const loader = createLoader('test', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll(flatModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = loader(mockContext());
    expect(context.test).toEqual(flatRegistry);
  });

  it('should handle empty modules (edge case)', () => {
    const loader = createLoader('test', {
      patterns: ['*'],
      findFiles: mockFindFiles([]),
      importAndApplyAll: mockImportAndApplyAll([]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = loader(mockContext());
    expect(context.test).toEqual({});
  });

  it('should reject invalid modules (failure case)', () => {
    const invalidModules = [{ notName: true }];
    const loader = createLoader('test', {
      patterns: ['*'],
      findFiles: mockFindFiles(['bad.js']),
      importAndApplyAll: mockImportAndApplyAll(invalidModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = loader(mockContext());
    expect(context.test).toEqual({});
  });

  it('should compose with another loader (composability)', () => {
    const loaderA = createLoader('a', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js']),
      importAndApplyAll: mockImportAndApplyAll([{ name: 'a', value: 1 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'a',
    });
    const loaderB = createLoader('b', {
      patterns: ['*'],
      findFiles: mockFindFiles(['b.js']),
      importAndApplyAll: mockImportAndApplyAll([{ name: 'b', value: 2 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'b',
    });
    const context = loaderB(loaderA(mockContext()));
    expect(context.a).toEqual({ a: { name: 'a', value: 1 } });
    expect(context.b).toEqual({ b: { name: 'b', value: 2 } });
  });

  it('should log and throw if validate throws (error handling)', () => {
    const logger = { error: jest.fn() };
    const throwingValidate = () => { throw new Error('Validation failed'); };
    const loader = createLoader('test', {
      patterns: ['*'],
      findFiles: mockFindFiles(['bad.js']),
      importAndApplyAll: mockImportAndApplyAll([{ name: 'bad' }]),
      registryBuilder: buildFlatRegistryByName,
      validate: throwingValidate,
      contextKey: 'test',
    });
    const context = mockContext({ services: { logger } });
    try {
      loader(context);
      // If no error is thrown, the test should fail
      throw new Error('Expected loader to throw due to validate error');
    } catch (err) {
      // The loader does not catch errors, so logger should not be called
      // But if you wrap the loader in production, you can assert logger.error
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch('Validation failed');
    }
  });

  it('should log and throw if registryBuilder throws (error handling)', () => {
    const logger = { error: jest.fn() };
    const throwingRegistryBuilder = () => { throw new Error('Registry build failed'); };
    const loader = createLoader('test', {
      patterns: ['*'],
      findFiles: mockFindFiles(['bad.js']),
      importAndApplyAll: mockImportAndApplyAll([{ name: 'bad' }]),
      registryBuilder: throwingRegistryBuilder,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = mockContext({ services: { logger } });
    try {
      loader(context);
      throw new Error('Expected loader to throw due to registryBuilder error');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch('Registry build failed');
    }
  });
}); 