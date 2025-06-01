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
  options: 'object'
};

/**
 * Create the route loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createRouteLoader = (options = {}) => {
  const loader = createLoader('routes', {
    ...options,
    patterns: ROUTE_PATTERNS,
    validate: (module) => validationHook(module, routeSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
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