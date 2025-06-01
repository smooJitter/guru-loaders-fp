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
  options: ['object', 'undefined']
};

/**
 * Create the JSON loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple JSON objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createJsonLoader = (options = {}) => {
  const loader = createLoader('json', {
    ...options,
    patterns: JSON_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const jsonObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const jsonList = Array.isArray(jsonObjs) ? jsonObjs : [jsonObjs];
      // Validate all JSON objects in the array
      return jsonList.every(jsonObj => validationHook(jsonObj, jsonSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const jsonObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const jsonList = Array.isArray(jsonObjs) ? jsonObjs : [jsonObjs];
      // Inject context/services if needed
      return jsonList.map(jsonObj => {
        const injected = contextInjectionHook(jsonObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'json',
          timestamp: Date.now()
        };
      });
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