import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for fakers
const FAKER_PATTERNS = {
  default: '**/*-faker.js',
  index: '**/faker/**/index.js'
};

// Faker validation schema for the validation hook
const fakerSchema = {
  name: 'string',
  model: 'string',
  count: 'number',
  data: 'function',
  options: ['object', 'undefined']
};

/**
 * Create the faker loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple faker objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createFakerLoader = (options = {}) => {
  const loader = createLoader('faker', {
    ...options,
    patterns: FAKER_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const fakerObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const fakerList = Array.isArray(fakerObjs) ? fakerObjs : [fakerObjs];
      // Validate all faker objects in the array
      return fakerList.every(fakerObj => validationHook(fakerObj, fakerSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const fakerObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const fakerList = Array.isArray(fakerObjs) ? fakerObjs : [fakerObjs];
      // Inject context/services if needed
      return fakerList.map(fakerObj => {
        const injected = contextInjectionHook(fakerObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'faker',
          timestamp: Date.now()
        };
      });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading faker modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 