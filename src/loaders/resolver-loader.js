import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for resolvers
const RESOLVER_PATTERNS = {
  default: '**/*.resolver.js',
  index: '**/resolvers/**/*.index.js'
};

// Resolver validation schema for the validation hook
const resolverSchema = {
  name: 'string',
  methods: 'object',
  meta: ['object', 'undefined'],
  options: ['object', 'undefined']
};

/**
 * Create the resolver loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple resolver objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createResolverLoader = (options = {}) => {
  const loader = createLoader('resolvers', {
    ...options,
    patterns: RESOLVER_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const resolverObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const resolverList = Array.isArray(resolverObjs) ? resolverObjs : [resolverObjs];
      // Validate all resolver objects in the array
      return resolverList.every(resolverObj => validationHook(resolverObj, resolverSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const resolverObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const resolverList = Array.isArray(resolverObjs) ? resolverObjs : [resolverObjs];
      // Inject context/services if needed
      return resolverList.map(resolverObj => {
        const injected = contextInjectionHook(resolverObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'resolver',
          timestamp: Date.now()
        };
      });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading resolver modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 