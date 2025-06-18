/**
 * Async loader creation and orchestration utilities for loader-utils-new.
 * Uses async file finding, async transforms/validation, and async module processing.
 *
 * Example usage:
 * import { createAsyncLoader, composeTransforms } from './core/loader-core';
 * const loader = createAsyncLoader('event', { ... });
 * const { context } = await loader({ ... });
 */
import fg from 'fast-glob';
import { findFiles, importAndApply, watchFiles } from '../file-utils-new.js';
import { buildRegistry } from './registry.js';
import { mapAsync, filterAsync } from '../async-collection-utils.js';

// Async file finding using fast-glob
export const asyncFindFiles = findFiles;

// Async process a single module
export const asyncProcessModule = (type, options) => async (file, context) => {
  const { transform, validate, onInvalid, logger } = options;
  try {
    const module = await options.importModule(file, context);
    if (!module) return null;
    const transformed = await transform(module, context);
    if (!transformed) return null;
    if (!(await validate(type, transformed))) {
      await onInvalid(transformed, context);
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

// Async process all modules
export const asyncProcessModules = (type, options) => async (files, context) => {
  const processed = await mapAsync(asyncProcessModule(type, options))(files);
  return processed.filter(Boolean);
};

// Async setup file watcher if enabled
export const asyncSetupWatcher = (type, options) => async (patterns, context, reloadFn) => {
  if (!options.watch) return () => {};
  return watchFiles(patterns, async () => {
    const newContext = await reloadFn(context);
    Object.assign(context, newContext);
  });
};

// Main async loader factory
export const createAsyncLoader = (type, userOptions = {}) => {
  const options = {
    patterns: [],
    validate: async () => true,
    transform: async (m) => m,
    watch: false,
    logger: console,
    importModule: importAndApply,
    findFiles: asyncFindFiles,
    onDuplicate: async () => {},
    onInvalid: async () => {},
    ...userOptions
  };
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
      const modules = await asyncProcessModules(type, options)(files, context);
      const registry = buildRegistry(modules, context, {
        type: options.registryType || 'flat',
        transformFn: options.transform,
        logger
      });
      context[type] = { ...(context[type] || {}), ...registry };
      const cleanup = await asyncSetupWatcher(type, options)(
        patterns,
        context,
        async (ctx) => {
          const { context: newContext } = await createAsyncLoader(type, options)(ctx);
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