import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fileUtils from '../../utils/file-utils.js';
import loadFeatures from '../feature-loader/index.js';
import * as R from 'ramda';
import { discoverFeatureArtifacts as realDiscoverFeatureArtifacts } from '../feature-loader/discover-feature-artifacts.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockFindFiles = jest.fn(async () => ['features/foo/index.js', 'features/bar/index.js']);
const mockDiscoverFeatureArtifacts = jest.fn(async (featureDir) => {
  if (featureDir.endsWith('foo')) {
    return {
      typeComposers: { fooTC: { value: 1 } },
      queries: {},
      mutations: {},
      resolvers: {}
    };
  } else if (featureDir.endsWith('bar')) {
    return {
      typeComposers: { barTC: { value: 2 } },
      queries: {},
      mutations: {},
      resolvers: {}
    };
  }
  return { typeComposers: {}, queries: {}, mutations: {}, resolvers: {} };
});

const fakeFeatures = [
  { name: 'foo', value: 1 },
  { name: 'bar', value: 2 }
];

const baseContext = {
  schemaComposer: {},
  typeComposers: {},
  queries: {},
  mutations: {},
  resolvers: {}
};

// Patch dynamic import in feature-loader if needed
// If feature-loader uses import(), refactor to accept importModule for testability

describe('loadFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers features (happy path)', async () => {
    const mockContext = R.clone(baseContext);
    const ctx = await loadFeatures({
      logger: mockLogger,
      findFiles: mockFindFiles,
      context: mockContext,
      discoverFeatureArtifacts: mockDiscoverFeatureArtifacts,
      watch: false
    });
    expect(ctx.typeComposers).toHaveProperty('fooTC');
    expect(ctx.typeComposers.fooTC.value).toBe(1);
    expect(ctx.typeComposers).toHaveProperty('barTC');
    expect(ctx.typeComposers.barTC.value).toBe(2);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('handles no features found (edge case)', async () => {
    const mockContext = R.clone(baseContext);
    mockFindFiles.mockResolvedValueOnce([]);
    const ctx = await loadFeatures({
      logger: mockLogger,
      findFiles: mockFindFiles,
      context: mockContext,
      discoverFeatureArtifacts: mockDiscoverFeatureArtifacts,
      watch: false
    });
    expect(Object.keys(ctx.typeComposers)).toEqual([]);
  });

  it('logs and throws on artifact error (failure path)', async () => {
    const mockContext = R.clone(baseContext);
    mockDiscoverFeatureArtifacts.mockImplementationOnce(() => { throw new Error('fail'); });
    await expect(loadFeatures({
      logger: mockLogger,
      findFiles: mockFindFiles,
      context: mockContext,
      discoverFeatureArtifacts: mockDiscoverFeatureArtifacts,
      watch: false
    })).rejects.toThrow('fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('loads features with injected mocks', async () => {
    const mockContext = R.clone(baseContext);
    const ctx = await loadFeatures({
      logger: mockLogger,
      findFiles: mockFindFiles,
      context: mockContext,
      discoverFeatureArtifacts: mockDiscoverFeatureArtifacts,
      watch: false
    });
    expect(ctx.typeComposers).toHaveProperty('fooTC');
    expect(ctx.typeComposers.fooTC.value).toBe(1);
    expect(ctx.typeComposers).toHaveProperty('barTC');
    expect(ctx.typeComposers.barTC.value).toBe(2);
    expect(mockFindFiles).toHaveBeenCalled();
    expect(mockDiscoverFeatureArtifacts).toHaveBeenCalled();
  });
}); 