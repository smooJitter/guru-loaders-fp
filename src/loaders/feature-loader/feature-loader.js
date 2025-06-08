// src/loaders/featureLoader.js

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { findFiles as realFindFiles } from '../../utils/file-utils.js';
import logger from '../../utils/logger.js';
import { discoverFeatureArtifacts } from './discover-feature-artifacts.js';
import { validateFeatureContext, injectFeatureContext, runFeatureLifecycle } from './context.js';
import { findFeatureFiles, aggregateFeatureArtifacts } from './discovery.js';
import { mergeFeatureRegistries, reportDuplicates } from './merge.js';
import { setupFeatureHotReload } from './hot-reload.js';

let reloadCallback = null;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export function onFeaturesReload(cb) {
  reloadCallback = cb;
}

export default async function featureLoader({
  logger: customLogger = logger,
  context = {},
  patterns,
  watch = process.env.NODE_ENV === 'development',
  onReload,
  importModule = (file) => import(pathToFileURL(file).href),
  findFiles = realFindFiles,
  discoverFeatureArtifacts: injectedDiscoverFeatureArtifacts
} = {}) {
  // 1. Validate and inject context
  let loaderContext = { ...context, logger: customLogger };
  try {
    await runFeatureLifecycle('beforeAll', loaderContext);
    validateFeatureContext(loaderContext);
    loaderContext = injectFeatureContext(loaderContext);
  } catch (err) {
    customLogger.error('featureLoader: context setup failed:', err);
    await runFeatureLifecycle('onError', { error: err, ...loaderContext });
    throw err;
  }

  // 2. Find feature files
  const defaultPatterns = ['src/features/*/index.js'];
  const usePatterns = patterns || defaultPatterns;
  let files = [];
  try {
    files = await findFeatureFiles(usePatterns, findFiles, customLogger);
  } catch (err) {
    customLogger.error('featureLoader: Error during file discovery:', err);
    await runFeatureLifecycle('onError', { error: err, ...loaderContext });
    throw err;
  }

  // 3. Aggregate artifacts
  const discoverArtifacts = injectedDiscoverFeatureArtifacts || discoverFeatureArtifacts;
  let featureManifests = [], errors = [];
  try {
    const result = await aggregateFeatureArtifacts(files, discoverArtifacts, loaderContext, customLogger);
    featureManifests = result.featureManifests;
    errors = result.errors;
  } catch (err) {
    customLogger.error('featureLoader: Error during artifact aggregation:', err);
    await runFeatureLifecycle('onError', { error: err, ...loaderContext });
    throw err;
  }

  // If any errors were collected, log and throw
  if (errors && errors.length > 0) {
    customLogger.error('featureLoader: Errors during artifact aggregation:', errors);
    await runFeatureLifecycle('onError', { error: errors, ...loaderContext });
    // Extract error messages for better debugging
    const errorMessages = errors.map(e => {
      if (e && e.error && e.error.message) return e.error.message;
      if (e && e.error && typeof e.error === 'string') return e.error;
      return JSON.stringify(e.error || e);
    }).join('; ');
    throw new Error('featureLoader: Errors during artifact aggregation: ' + errorMessages);
  }

  // 4. Merge registries and report duplicates
  const { typeComposersList, queriesList, mutationsList, resolversList } = mergeFeatureRegistries(loaderContext, featureManifests);
  reportDuplicates(typeComposersList, queriesList, mutationsList, resolversList, customLogger);

  // 5. Hot reload support
  if (watch) {
    setupFeatureHotReload(
      usePatterns,
      projectRoot,
      onReload,
      reloadCallback,
      { featureLoader, logger: customLogger, context, patterns: usePatterns, watch, onReload, importModule, findFiles, discoverFeatureArtifacts: discoverArtifacts },
      customLogger
    );
  }

  // 6. Lifecycle: afterAll
  try {
    await runFeatureLifecycle('afterAll', loaderContext);
  } catch (err) {
    customLogger.error('featureLoader: afterAll hook error:', err);
  }

  return loaderContext;
}
