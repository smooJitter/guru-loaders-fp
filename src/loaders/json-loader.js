import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for JSON
const JSON_PATTERNS = {
  default: '**/*-json.js',
  index: '**/json/**/index.js'
};

// JSON validation schema for the validation hook
const jsonSchema = {
  name: 'string',
  data: 'object',
  options: 'object'
};

/**
 * Create the JSON loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createJsonLoader = (options = {}) => {
  const loader = createLoader('json', {
    ...options,
    patterns: JSON_PATTERNS,
    validate: (module) => validationHook(module, jsonSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading JSON modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 