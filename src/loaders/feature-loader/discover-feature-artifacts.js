import fg from 'fast-glob';
import path from 'path';

/**
 * Discover and aggregate all queries, mutations, typeComposers, and resolvers in a feature directory.
 * Supports both .tc.js and .types.js for type composers.
 * @param {string} featureDir - Absolute path to the feature directory (e.g., 'src/features/foo')
 * @returns {Promise<{ queries: object, mutations: object, typeComposers: object, resolvers: object }>} Aggregated registries
 */
export async function discoverFeatureArtifacts(featureDir) {
  const patterns = [
    '**/*.queries.js',
    '**/*.mutations.js',
    '**/*.resolvers.js',
    // Support both .tc.js and .types.js for type composers
    '**/*.tc.js',
    '**/*.types.js',
  ];
  const files = await fg(patterns, { cwd: featureDir, onlyFiles: true, absolute: true });

  const registries = {
    queries: {},
    mutations: {},
    typeComposers: {},
    resolvers: {}
  };

  for (const file of files) {
    const mod = await import(file);
    if (file.endsWith('.queries.js')) Object.assign(registries.queries, mod);
    if (file.endsWith('.mutations.js')) Object.assign(registries.mutations, mod);
    if (file.endsWith('.tc.js') || file.endsWith('.types.js')) Object.assign(registries.typeComposers, mod);
    if (file.endsWith('.resolvers.js')) Object.assign(registries.resolvers, mod);
  }

  return registries;
} 