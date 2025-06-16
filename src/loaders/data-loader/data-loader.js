import { createLoader } from '../../utils/loader-utils.js';
import { assoc, reduce } from 'ramda';

const DATA_PATTERNS = [
  '**/*.data.js',
  '**/data/**/*.index.js'
];

/**
 * Extract and transform data loader module(s) (async support)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {Promise<object[]>} Array of data loader objects
 */
export const extractDataLoader = async (module, ctx) => {
  if (!module || typeof module !== 'object') return [];
  let dataObjs;
  if (typeof module.default === 'function') {
    dataObjs = await module.default({ services: ctx?.services, config: ctx?.config });
  } else {
    dataObjs = module.default;
  }
  const dataList = Array.isArray(dataObjs) ? dataObjs : [dataObjs];
  return dataList
    .filter(Boolean)
    .map(obj => ({
      ...obj,
      type: 'data',
      timestamp: Date.now()
    }));
};

/**
 * Validate a data loader module
 * @param {string} type - The loader type ("dataLoaders")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateDataLoaderModule = (type, module) => {
  // Note: For validation, we assume extractDataLoader is sync (for loader-utils compatibility)
  const dataObjs = Array.isArray(module) ? module : [module];
  return dataObjs.every(obj =>
    obj &&
    typeof obj.name === 'string' &&
    typeof obj.model === 'string' &&
    typeof obj.batchFn === 'function'
  );
};

/**
 * Create a robust, extensible data loader with optional lifecycle hooks.
 * @param {object} options - Loader options (patterns, onLoad, onInit, onError, etc.)
 * @returns {function} Loader function
 */
export const createDataLoader = (options = {}) => {
  const {
    onLoad,
    onInit,
    onError,
    ...rest
  } = options;

  return createLoader('dataLoaders', {
    patterns: rest.patterns || DATA_PATTERNS,
    ...rest,
    // Async transform support
    transform: async (module, ctx) => {
      try {
        const dataObjs = await extractDataLoader(module, ctx);
        const registry = reduce((acc, obj) => {
          if (obj && obj.name) return assoc(obj.name, obj, acc);
          return acc;
        }, {}, dataObjs);
        if (onLoad) await onLoad(registry, ctx);
        return registry;
      } catch (err) {
        if (onError) onError(err, module, ctx);
        throw err;
      }
    },
    validate: validateDataLoaderModule,
    // Lifecycle hook: called after all loaders are initialized
    async onInit(context) {
      if (onInit) await onInit(context);
    }
  });
};

export default createDataLoader(); 