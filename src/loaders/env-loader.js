import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for environment configs
const ENV_PATTERNS = {
  default: '**/*-environment.js',
  index: '**/environment/**/index.js'
};

// Environment validation schema for the validation hook
const envSchema = {
  name: 'string',
  config: 'object',
  options: 'object'
};

/**
 * Create the environment loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createEnvLoader = (options = {}) => {
  const loader = createLoader('env', {
    ...options,
    patterns: ENV_PATTERNS,
    validate: (module) => validationHook(module, envSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading environment modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 