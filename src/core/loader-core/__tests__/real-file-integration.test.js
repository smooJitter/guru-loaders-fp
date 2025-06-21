import path from 'path';
import fs from 'fs/promises';
import { createFeatureLoader } from '../loader-async-feature.js';

// Use process.cwd() as the root, then resolve relative to this test file's location
const testDir = path.resolve(process.cwd(), 'src/core/loader-core/__tests__');
const fixturesDir = path.resolve(testDir, '__fixtures__/features');
const brokenDir = path.resolve(testDir, '__fixtures__/broken');
const emptyDir = path.resolve(testDir, '__fixtures__/emptydir');

function mockContext(services = {}) {
  return { services };
}

function mockLogger() {
  const calls = { error: [], warn: [], info: [] };
  return {
    error: (...args) => calls.error.push(args),
    warn: (...args) => calls.warn.push(args),
    info: (...args) => calls.info.push(args),
    calls,
  };
}

describe('real-file integration: feature loader', () => {
  test('loads valid features and ignores invalid/throwing ones', async () => {
    const logger = mockLogger();
    const context = mockContext({ logger });
    const patterns = [path.join(fixturesDir, '*')];
    const { findFilesAndDirs } = await import('../../../utils/file-utils-new.js');
    const discoveredPaths = await findFilesAndDirs(patterns);
    // Optionally log: console.log('Discovered paths:', discoveredPaths);
    const featureLoader = createFeatureLoader({
      patterns,
      contextKey: 'features',
      validate: m => m && typeof m.typeComposers === 'object',
    });
    const files = await fs.readdir(fixturesDir);
    // Optionally log: console.log('Discovered fixture files:', files);
    const ctx = await featureLoader(context);
    // Optionally log: console.log('Loaded features:', ctx.features);
    expect(ctx.features.typeComposers.Valid).toBeDefined();
    expect(ctx.features.typeComposers.Indexed).toBeDefined();
    expect(ctx.features.queries.validQuery).toBeDefined();
    expect(ctx.features.queries.indexedQuery).toBeDefined();
    expect(ctx.features.typeComposers.invalidFeature).toBeUndefined();
    expect(ctx.features.typeComposers.throwsOnImport).toBeUndefined();
    expect(logger.calls.error.length).toBeGreaterThan(0);
  });

  test('handles empty directory', async () => {
    const logger = mockLogger();
    const context = mockContext({ logger });
    const featureLoader = createFeatureLoader({
      patterns: [emptyDir],
      contextKey: 'features',
      validate: m => m && typeof m.typeComposers === 'object',
    });
    const ctx = await featureLoader(context);
    expect(ctx.features).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
  });

  test('handles directory with no index.js', async () => {
    const logger = mockLogger();
    const context = mockContext({ logger });
    const featureLoader = createFeatureLoader({
      patterns: [path.join(brokenDir, 'noIndexDir')],
      contextKey: 'features',
      validate: m => m && typeof m.typeComposers === 'object',
    });
    const ctx = await featureLoader(context);
    expect(ctx.features).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
    expect(logger.calls.warn.length).toBe(1);
  });

  test('handles stat errors gracefully', async () => {
    const logger = mockLogger();
    const context = mockContext({ logger });
    const statErrorPath = path.join(brokenDir, 'throwsOnStat.js');
    // Ensure the file exists before deleting
    try {
      await fs.access(statErrorPath);
    } catch {
      await fs.writeFile(statErrorPath, '// recreated for stat error test');
    }
    // Now delete the file to simulate stat error
    try {
      await fs.unlink(statErrorPath);
    } catch (e) {}
    const featureLoader = createFeatureLoader({
      patterns: [statErrorPath],
      contextKey: 'features',
      validate: m => m && typeof m.typeComposers === 'object',
    });
    const ctx = await featureLoader(context);
    expect(ctx.features).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
    expect(logger.calls.error.length).toBe(0);
  });
}); 