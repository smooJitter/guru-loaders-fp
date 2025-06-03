import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for middleware
const MIDDLEWARE_PATTERNS = {
  default: '**/*.middleware.js',
  index: '**/middleware/**/*.index.js'
};

// Middleware validation schema for the validation hook
const middlewareSchema = {
  name: 'string',
  middleware: 'function',
  options: ['object', 'undefined']
};

/**
 * Create the middleware loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple middleware objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createMiddlewareLoader = (options = {}) => {
  const loader = createLoader('middleware', {
    ...options,
    patterns: MIDDLEWARE_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const mwObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const mwList = Array.isArray(mwObjs) ? mwObjs : [mwObjs];
      // Validate all middleware objects in the array
      return mwList.every(mwObj => validationHook(mwObj, middlewareSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const mwObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const mwList = Array.isArray(mwObjs) ? mwObjs : [mwObjs];
      // Inject context/services if needed
      return mwList.map(mwObj => {
        const injected = contextInjectionHook(mwObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'middleware',
          timestamp: Date.now()
        };
      });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading middleware modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 