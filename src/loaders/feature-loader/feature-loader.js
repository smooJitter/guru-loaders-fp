// src/loaders/featureLoader.js

import { createAsyncLoader } from '../../core/loader-core/loader-async.js';
import { importAndApplyAllFeatures } from './importAndApplyAllFeatures.js';
import { featureRegistryBuilder } from './featureRegistryBuilder.js';
import { findFeatureFiles, aggregateFeatureArtifacts } from './discovery.js';
import { discoverFeatureArtifacts } from './discover-feature-artifacts.js';
import { validateFeatureContext, injectFeatureContext, runFeatureLifecycle } from './context.js';
import { mergeFeatureRegistries, reportDuplicates } from './merge.js';
import { getLoaderLogger } from '../../utils/loader-logger.js';

const FEATURE_PATTERNS = ['src/features/*/index.js'];

/**
 * Custom findFiles using discovery.js
 */
const customFindFiles = async (patterns, { logger }) => {
  return await findFeatureFiles(patterns, (pattern, opts) => {
    // You can inject your preferred file finder here if needed
    // For now, just use the default findFiles logic from discovery.js
    return findFeatureFiles([pattern], opts.logger);
  }, logger);
};

/**
 * Transform: Aggregate all artifacts for all features using discovery.js
 * @param {string[]} files - Feature entrypoint files
 * @param {object} ctx - The loader context
 * @returns {Promise<object[]>} Array of feature manifests
 */
export const extractFeatureArtifacts = async (files, ctx) => {
  const logger = getLoaderLogger(ctx, {}, 'feature-loader');
  const { featureManifests, errors } = await aggregateFeatureArtifacts(
    Array.isArray(files) ? files : [files],
    discoverFeatureArtifacts,
    ctx,
    logger
  );
  if (errors && errors.length > 0) {
    logger.error('featureLoader: Errors during artifact aggregation:', errors);
    throw new Error('featureLoader: Errors during artifact aggregation');
  }
  return featureManifests;
};

/**
 * Validate: Ensure required artifacts are present
 * @param {string} type - The loader type ("features")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateFeatureModule = (type, module) => {
  return (
    module &&
    (module.queries || module.mutations || module.typeComposers || module.resolvers)
  );
};

/**
 * Create the feature loader using createAsyncLoader and discovery.js utilities
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createFeatureLoader = (options = {}) =>
  createAsyncLoader('features', {
    patterns: options.patterns || FEATURE_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll || importAndApplyAllFeatures,
    registryBuilder: options.registryBuilder || featureRegistryBuilder,
    ...options
  });

const featureLoader = async (ctx = {}) => {
  ctx.features = ctx.features || [];
  const loader = createFeatureLoader({
    findFiles: ctx.findFiles,
    importAndApplyAll: ctx.importAndApplyAll,
    registryBuilder: ctx.registryBuilder,
  });
  const registries = await loader(ctx); // registries: { typeComposers, queries, ... }
  Object.assign(ctx, registries);
  return { context: ctx };
};

export default featureLoader;
