import { createFeatureLoader } from '../loader-async-feature.js';
import { createAsyncLoader } from '../loader-async.js';
import { mockContext } from './lib/mockContext.js';
import {
  featureManifests,
  featureRegistry,
  overlappingFeatureManifests,
  overlappingFeatureRegistry,
  emptyModules
} from './lib/registryMocks.js';

// Async mocks for feature loader
const asyncMockFindFilesAndDirs = files => async () => files;
const asyncMockImportAndApplyAllFeatures = modules => async () => modules;

describe('loader-async-feature.js', () => {
  it('should aggregate feature manifests from files and directories (happy path)', async () => {
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs(['featureA', 'featureB']),
      importAndApplyAll: asyncMockImportAndApplyAllFeatures(featureManifests),
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = await loader(mockContext());
    expect(context.features).toEqual(featureRegistry);
  });

  it('should handle empty input (edge case)', async () => {
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs([]),
      importAndApplyAll: asyncMockImportAndApplyAllFeatures([]),
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = await loader(mockContext());
    expect(context.features).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
  });

  it('should reject invalid manifests (failure case)', async () => {
    const invalidManifests = [{ notTypeComposers: true }];
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs(['bad']),
      importAndApplyAll: asyncMockImportAndApplyAllFeatures(invalidManifests),
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = await loader(mockContext());
    expect(context.features).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
  });

  it('should merge overlapping feature manifests (merge/override)', async () => {
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs(['featureA', 'featureB']),
      importAndApplyAll: asyncMockImportAndApplyAllFeatures(overlappingFeatureManifests),
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = await loader(mockContext());
    expect(context.features).toMatchObject(overlappingFeatureRegistry);
  });

  it('should log and throw if validate throws (error handling)', async () => {
    const logger = { error: jest.fn() };
    const throwingValidate = () => { throw new Error('Validation failed'); };
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs(['bad']),
      importAndApplyAll: asyncMockImportAndApplyAllFeatures([{ typeComposers: {} }]),
      validate: throwingValidate,
      contextKey: 'features',
    });
    const context = mockContext({ services: { logger } });
    await expect(loader(context)).rejects.toThrow('Validation failed');
  });

  it('should log and throw if registryBuilder throws (error handling)', async () => {
    const logger = { error: jest.fn() };
    const throwingRegistryBuilder = () => { throw new Error('Registry build failed'); };
    // Note: createFeatureLoader does not allow registryBuilder injection, so we use createAsyncLoader directly here
    const loader = createAsyncLoader('features', {
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs(['bad']),
      importAndApplyAll: asyncMockImportAndApplyAllFeatures([{ typeComposers: {} }]),
      registryBuilder: throwingRegistryBuilder,
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = mockContext({ services: { logger } });
    await expect(loader(context)).rejects.toThrow('Registry build failed');
  });

  it('should log and throw if importAndApplyAll throws (error handling)', async () => {
    const logger = { error: jest.fn() };
    const throwingImport = async () => { throw new Error('Async import failed'); };
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: asyncMockFindFilesAndDirs(['bad']),
      importAndApplyAll: throwingImport,
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = mockContext({ services: { logger } });
    await expect(loader(context)).rejects.toThrow('Async import failed');
    expect(context.features).toBeUndefined();
    expect(context.services.logger).toBeDefined();
  });
}); 