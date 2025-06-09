import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import * as R from 'ramda';

/**
 * File patterns for data loaders
 */
const DATA_PATTERNS = {
  default: '**/*.data.js',
  index: '**/data/**/*.index.js'
};

/**
 * Data loader validation schema for the validation hook
 */
const dataLoaderSchema = {
  name: 'string',
  model: 'string',
  batchFn: 'function',
  options: ['object', 'undefined']
};

/**
 * Create the data loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple data loader objects.
 * Aggregates all data-loaders into a registry keyed by name and attaches to context.dataLoaders.
 * Warns on duplicate names.
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

  /**
   * Loader function that aggregates all data-loaders into a registry and attaches to context.dataLoaders
   * @param {object} context
   * @returns {Promise<{ context: object, cleanup: function }>} 
   */
  return async (context) => {
    loggingHook(context, 'Loading data loader modules');

    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      // Aggregate all loaded data-loaders into a registry keyed by name
      const allDataLoaders = R.pipe(
        R.values,
        R.flatten,
        R.filter(R.is(Object)),
        R.indexBy(dl => dl.name)
      )(loaderContext.data || {});

      // Warn on duplicate names
      const names = R.pluck('name', R.flatten(R.values(loaderContext.data || {})));
      const dupes = R.keys(R.pickBy((v) => v > 1, R.countBy(R.identity, names)));
      if (dupes.length && context?.services?.logger) {
        context.services.logger.warn('[data-loader] Duplicate data-loader names found:', dupes);
      }

      // Attach to context
      loaderContext.dataLoaders = allDataLoaders;

      return { context: loaderContext, cleanup };
    }, context);
  };
}; 