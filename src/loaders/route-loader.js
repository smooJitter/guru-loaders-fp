import { createLoaderWithMiddleware } from '../utils/loader-utils.js';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for routes
const ROUTE_PATTERNS = {
  default: '**/*.route.js',
  index: '**/routes/**/*.index.js'
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
  const logMiddleware = (context) => loggingHook(context, 'Loading route modules');

  const loader = createLoaderWithMiddleware('route', [logMiddleware], {
    ...options,
    patterns: ROUTE_PATTERNS,
    validate: (module, context) => {
      const routeObjs = typeof module.default === 'function'
        ? module.default(context)
        : module.default;
      const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
      return routeList.every(routeObj => validationHook(routeObj, routeSchema));
    },
    transform: (module, context) => {
      const routeObjs = typeof module.default === 'function'
        ? module.default(context)
        : module.default;
      const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
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

  return async (context) => {
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 