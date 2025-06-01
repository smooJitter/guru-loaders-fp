import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for data loaders
const DATA_PATTERNS = {
  default: '**/*-data.js',
  index: '**/data/**/index.js'
};

// Data loader validation schema for the validation hook
const dataLoaderSchema = {
  name: 'string',
  model: 'string',
  batchFn: 'function',
  options: ['object', 'undefined']
};

/**
 * Create the data loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple data loader objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createDataLoader = (options = {}) => {
  const loader = createLoader('data', {
    ...options,
    patterns: DATA_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const dataObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const dataList = Array.isArray(dataObjs) ? dataObjs : [dataObjs];
      // Validate all data loader objects in the array
      return dataList.every(dataObj => validationHook(dataObj, dataLoaderSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const dataObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const dataList = Array.isArray(dataObjs) ? dataObjs : [dataObjs];
      // Inject context/services if needed
      return dataList.map(dataObj => {
        const injected = contextInjectionHook(dataObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'data',
          timestamp: Date.now()
        };
      });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading data loader modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 