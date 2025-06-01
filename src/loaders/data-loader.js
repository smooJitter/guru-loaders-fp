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
  options: 'object'
};

/**
 * Create the data loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createDataLoader = (options = {}) => {
  const loader = createLoader('data', {
    ...options,
    patterns: DATA_PATTERNS,
    validate: (module) => validationHook(module, dataLoaderSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
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