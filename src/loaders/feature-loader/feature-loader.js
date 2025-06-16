// src/loaders/featureLoader.js

import { createLoader } from '../../utils/loader-utils.js';
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
 * Create the feature loader using createLoader and discovery.js utilities
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createFeatureLoader = (options = {}) =>
  createLoader('features', {
    patterns: options.patterns || FEATURE_PATTERNS,
    findFiles: options.findFiles || customFindFiles,
    ...options,
    transform: options.transform || extractFeatureArtifacts,
    validate: options.validate || validateFeatureModule,
    async onInit(context) {
      validateFeatureContext(context);
      injectFeatureContext(context);
      await runFeatureLifecycle('beforeAll', context);

      // Merge all feature registries
      const featureManifests = context.features || [];
      const { typeComposersList, queriesList, mutationsList, resolversList } =
        mergeFeatureRegistries(context, featureManifests);

      // Report duplicates
      const logger = getLoaderLogger(context, options, 'feature-loader');
      reportDuplicates(typeComposersList, queriesList, mutationsList, resolversList, logger);

      await runFeatureLifecycle('afterAll', context);
    }
  });

export default createFeatureLoader();
