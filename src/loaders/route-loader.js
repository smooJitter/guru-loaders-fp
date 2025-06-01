import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for routes
const ROUTE_PATTERNS = {
  default: '**/*-route.js',
  index: '**/routes/**/index.js'
};

// Route validation schema for the validation hook
const routeSchema = {
  name: 'string',
  routes: 'array',
  options: ['object', 'undefined']
};

/**
 * Create the route loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple route objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createRouteLoader = (options = {}) => {
  const loader = createLoader('routes', {
    ...options,
    patterns: ROUTE_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const routeObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
      // Validate all route objects in the array
      return routeList.every(routeObj => validationHook(routeObj, routeSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const routeObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
      // Inject context/services if needed
      return routeList.map(routeObj => {
        const injected = contextInjectionHook(routeObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'route',
          timestamp: Date.now()
        };
      });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading route modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 