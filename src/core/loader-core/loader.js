/**
 * Loader creation and orchestration utilities for loader-utils-new.
 * Includes createFunctionalLoader, processModules, setupWatcher, and defaultOptions.
 */
import { findFiles, importAndApply, watchFiles } from '../file-utils-new.js';
import { buildRegistry } from './registry.js';

// Default loader options
export const defaultOptions = {
  patterns: [],
  validate: () => true,
  transform: (m) => m,
  watch: false,
  logger: console,
  importModule: importAndApply,
  findFiles: findFiles,
  onDuplicate: () => {},
  onInvalid: () => {}
};

// Process a single module
export const processModule = (type, options) => async (file, context) => {
  const { transform, validate, onInvalid, logger } = options;
  try {
    const module = await options.importModule(file, context);
    if (!module) return null;
    const transformed = transform(module, context);
    if (!transformed) return null;
    if (!validate(type, transformed)) {
      onInvalid(transformed, context);
      return null;
    }
    return transformed;
  } catch (err) {
    logger.warn?.(
      `[${type}-loader] Error processing file: ${file}`,
      { file, error: err, stack: err?.stack }
    );
    return null;
  }
};

// Process all modules
export const processModules = (type, options) => async (files, context) =>
  Promise.all(
    files.map(file => processModule(type, options)(file, context))
  ).then(arr => arr.filter(Boolean));

// Setup file watcher if enabled
export const setupWatcher = (type, options) => async (patterns, context, reloadFn) => {
  if (!options.watch) return () => {};
  return watchFiles(patterns, async () => {
    const newContext = await reloadFn(context);
    Object.assign(context, newContext);
  });
};

// Main functional loader factory
export const createFunctionalLoader = (type, userOptions = {}) => {
  const options = { ...defaultOptions, ...userOptions };
  const { patterns, logger, fastGlobOptions = {} } = options;

  return async (ctx) => {
    const context = { ...ctx };
    try {
      logger.info?.(
        `[${type}-loader] Finding files with patterns:`,
        patterns,
        'and fast-glob options:',
        fastGlobOptions
      );
      const files = await options.findFiles(patterns, fastGlobOptions);
      logger.info?.(
        `[${type}-loader] Found ${files.length} files.`,
        files.length <= 10 ? files : '[file list omitted]'
      );
      const modules = await processModules(type, options)(files, context);
      const registry = buildRegistry(modules, context, {
        type: options.registryType || 'flat',
        transformFn: options.transform,
        logger
      });
      context[type] = { ...(context[type] || {}), ...registry };
      const cleanup = await setupWatcher(type, options)(
        patterns,
        context,
        async (ctx) => {
          const { context: newContext } = await createFunctionalLoader(type, options)(ctx);
          return newContext;
        }
      );
      return { context, cleanup };
    } catch (err) {
      logger.error?.(
        `[${type}-loader] Error during loading.`,
        {
          patterns,
          fastGlobOptions,
          error: err,
          stack: err?.stack
        }
      );
      return { context, cleanup: () => {} };
    }
  };
}; 