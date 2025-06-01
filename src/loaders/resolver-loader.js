import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for resolvers
const RESOLVER_PATTERNS = {
  default: '**/*-resolver.js',
  index: '**/resolvers/**/index.js'
};

// Resolver validation schema for the validation hook
const resolverSchema = {
  name: 'string',
  methods: 'object',
  meta: 'object',
  options: 'object'
};

/**
 * Create the resolver loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createResolverLoader = (options = {}) => {
  const loader = createLoader('resolvers', {
    ...options,
    patterns: RESOLVER_PATTERNS,
    validate: (module) => validationHook(module, resolverSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
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