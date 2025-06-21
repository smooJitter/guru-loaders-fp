import { describe, it, expect } from '@jest/globals';
import { createLoader } from '../loader.js';
import { createAsyncLoader } from '../loader-async.js';
import { buildFlatRegistryByName } from '../lib/registry-builders.js';
import { mockContext } from './lib/mockContext.js';
import {
  flatModules,
  flatRegistry,
  namespacedModules,
  namespacedRegistry,
  hierarchicalModules,
  hierarchicalRegistry,
  deepHierarchicalModules,
  deepHierarchicalRegistry,
  eventModules,
  eventRegistry,
  advancedEventModules,
  advancedEventRegistry,
  featureManifests,
  featureRegistry,
  overlappingFeatureManifests,
  overlappingFeatureRegistry,
  missingKeyModules,
  invalidTypeModules,
  emptyModules
} from './lib/registryMocks.js';
import {
  buildNamespacedRegistry,
  buildHierarchicalRegistry,
  buildEventRegistry,
  buildFeatureRegistries
} from '../lib/registry-builders.js';

const mockFindFiles = files => () => files;
const mockImportAndApplyAll = modules => () => modules;
const asyncMockFindFiles = files => async () => files;
const asyncMockImportAndApplyAll = modules => async () => modules;

describe('loader-core integration', () => {
  it('sync loader: end-to-end registry build and context assignment', () => {
    const loader = createLoader('actions', {
      patterns: ['*.js'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll(flatModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'actions',
    });
    const context = loader(mockContext());
    expect(context.actions).toEqual(flatRegistry);
    expect(context.services).toBeDefined();
  });

  it('async loader: end-to-end registry build and context assignment', async () => {
    const loader = createAsyncLoader('actions', {
      patterns: ['*.js'],
      findFiles: asyncMockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: asyncMockImportAndApplyAll(flatModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'actions',
    });
    const context = await loader(mockContext());
    expect(context.actions).toEqual(flatRegistry);
    expect(context.services).toBeDefined();
  });

  it('composes multiple loaders and merges context', async () => {
    const loaderA = createAsyncLoader('a', {
      patterns: ['a.js'],
      findFiles: asyncMockFindFiles(['a.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'a', value: 1 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'a',
    });
    const loaderB = createAsyncLoader('b', {
      patterns: ['b.js'],
      findFiles: asyncMockFindFiles(['b.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'b', value: 2 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'b',
    });
    let context = mockContext();
    context = await loaderA(context);
    context = await loaderB(context);
    expect(context.a).toEqual({ a: { name: 'a', value: 1 } });
    expect(context.b).toEqual({ b: { name: 'b', value: 2 } });
    expect(context.services).toBeDefined();
  });

  it('injects context and preserves services throughout pipeline', async () => {
    const loader = createAsyncLoader('actions', {
      patterns: ['*.js'],
      findFiles: asyncMockFindFiles(['a.js']),
      importAndApplyAll: asyncMockImportAndApplyAll([{ name: 'foo', value: 42 }]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'actions',
    });
    const baseContext = mockContext({ services: { logger: { info: jest.fn() } } });
    const context = await loader(baseContext);
    expect(context.actions).toEqual({ foo: { name: 'foo', value: 42 } });
    expect(context.services.logger).toBeDefined();
  });

  it('handles duplicate names (last wins in flat registry)', () => {
    const modules = [
      { name: 'foo', value: 1 },
      { name: 'foo', value: 2 }
    ];
    const loader = createLoader('dupes', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll(modules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'dupes',
    });
    const context = loader(mockContext());
    expect(context.dupes).toEqual({ foo: { name: 'foo', value: 2 } });
  });

  it('builds deeply nested hierarchical registry', () => {
    const loader = createLoader('hier', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll(deepHierarchicalModules),
      registryBuilder: buildHierarchicalRegistry,
      validate: m => !!m.name,
      contextKey: 'hier',
    });
    const context = loader(mockContext());
    expect(context.hier).toEqual(deepHierarchicalRegistry);
  });

  it('event registry: ignores invalid handlers, groups by name', () => {
    const modules = [
      ...advancedEventModules,
      { name: 'onSave', handler: 42 }, // invalid
      { name: 'onDelete', handler: null }
    ];
    const loader = createLoader('events', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll(modules),
      registryBuilder: buildEventRegistry,
      validate: m => !!m.name,
      contextKey: 'events',
    });
    const context = loader(mockContext());
    expect(context.events).toEqual(advancedEventRegistry);
  });

  it('feature registry: merges overlapping keys deeply', () => {
    const loader = createLoader('features', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll(overlappingFeatureManifests),
      registryBuilder: buildFeatureRegistries,
      validate: m => typeof m === 'object',
      contextKey: 'features',
    });
    const context = loader(mockContext());
    expect(context.features).toEqual(overlappingFeatureRegistry);
  });

  it('handles missing keys and invalid types gracefully', () => {
    const loader = createLoader('edge', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js', 'b.js']),
      importAndApplyAll: mockImportAndApplyAll([...missingKeyModules, ...invalidTypeModules]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m && typeof m.name === 'string',
      contextKey: 'edge',
    });
    const context = loader(mockContext());
    expect(context.edge).toEqual({ foo: { name: 'foo' } });
  });

  it('handles empty modules array', () => {
    const loader = createLoader('empty', {
      patterns: ['*'],
      findFiles: mockFindFiles([]),
      importAndApplyAll: mockImportAndApplyAll(emptyModules),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m && typeof m.name === 'string',
      contextKey: 'empty',
    });
    const context = loader(mockContext());
    expect(context.empty).toEqual({});
  });

  it('throws and preserves context if validate throws', () => {
    const throwingValidate = () => { throw new Error('Validation failed'); };
    const loader = createLoader('err', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js']),
      importAndApplyAll: mockImportAndApplyAll([{ name: 'foo' }]),
      registryBuilder: buildFlatRegistryByName,
      validate: throwingValidate,
      contextKey: 'err',
    });
    const baseContext = mockContext({ services: { logger: { error: jest.fn() } } });
    expect(() => loader(baseContext)).toThrow('Validation failed');
    // Context should not be mutated
    expect(baseContext.err).toBeUndefined();
    expect(baseContext.services.logger).toBeDefined();
  });

  it('throws and preserves context if registryBuilder throws', () => {
    const throwingRegistryBuilder = () => { throw new Error('Registry build failed'); };
    const loader = createLoader('err', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js']),
      importAndApplyAll: mockImportAndApplyAll([{ name: 'foo' }]),
      registryBuilder: throwingRegistryBuilder,
      validate: m => !!m.name,
      contextKey: 'err',
    });
    const baseContext = mockContext({ services: { logger: { error: jest.fn() } } });
    expect(() => loader(baseContext)).toThrow('Registry build failed');
    expect(baseContext.err).toBeUndefined();
    expect(baseContext.services.logger).toBeDefined();
  });

  it('throws and preserves context if importAndApplyAll throws', () => {
    const throwingImport = () => { throw new Error('Import failed'); };
    const loader = createLoader('err', {
      patterns: ['*'],
      findFiles: mockFindFiles(['a.js']),
      importAndApplyAll: throwingImport,
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'err',
    });
    const baseContext = mockContext({ services: { logger: { error: jest.fn() } } });
    expect(() => loader(baseContext)).toThrow('Import failed');
    expect(baseContext.err).toBeUndefined();
    expect(baseContext.services.logger).toBeDefined();
  });

  it('async loader: throws and preserves context if findFiles throws', async () => {
    const throwingFindFiles = async () => { throw new Error('Find failed'); };
    const loader = createAsyncLoader('err', {
      patterns: ['*'],
      findFiles: throwingFindFiles,
      importAndApplyAll: asyncMockImportAndApplyAll([]),
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'err',
    });
    const baseContext = mockContext({ services: { logger: { error: jest.fn() } } });
    await expect(loader(baseContext)).rejects.toThrow('Find failed');
    expect(baseContext.err).toBeUndefined();
    expect(baseContext.services.logger).toBeDefined();
  });

  it('async loader: throws and preserves context if importAndApplyAll throws', async () => {
    const throwingImport = async () => { throw new Error('Async import failed'); };
    const loader = createAsyncLoader('err', {
      patterns: ['*'],
      findFiles: asyncMockFindFiles(['a.js']),
      importAndApplyAll: throwingImport,
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'err',
    });
    const baseContext = mockContext({ services: { logger: { error: jest.fn() } } });
    await expect(loader(baseContext)).rejects.toThrow('Async import failed');
    expect(baseContext.err).toBeUndefined();
    expect(baseContext.services.logger).toBeDefined();
  });
}); 