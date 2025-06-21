// loader-async-feature.js — loader-core
/**
 * Async feature loader pipeline: discovery (files + dirs) → import/context → validation → registry build → assignment
 *
 * Usage Example:
 *
 * import { createFeatureLoader } from './loader-async-feature.js';
 * import { buildFeatureRegistries } from './lib/registry-builders.js';
 *
 * const featureLoader = createFeatureLoader({
 *   patterns: ['src/features/*'],
 *   validate: manifest => typeof manifest === 'object',
 *   contextKey: 'features',
 * });
 *
 * const context = await featureLoader({ services: myServices });
 * console.log(context.features); // { typeComposers, queries, mutations, resolvers }
 */
import { createAsyncLoader } from './loader-async.js';
import { findFilesAndDirs, importAndApplyAllFeatures } from '../../utils/file-utils-new.js';
import { buildFeatureRegistries } from './lib/registry-builders.js';

export function createFeatureLoader(options = {}) {
  const {
    patterns = ['src/features/*'],
    validate = () => true,
    contextKey = 'features',
    ...rest
  } = options;

  return createAsyncLoader('features', {
    patterns,
    findFiles: findFilesAndDirs,
    importAndApplyAll: importAndApplyAllFeatures,
    registryBuilder: buildFeatureRegistries,
    validate,
    contextKey,
    ...rest,
  });
} 