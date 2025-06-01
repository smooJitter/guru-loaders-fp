import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for auth
const AUTH_PATTERNS = {
  default: '**/auth-*.js',
  roles: '**/roles-*.js',
  guards: '**/guards-*.js',
  index: '**/auth/index.js'
};

// Auth validation schema for the validation hook
const authSchema = {
  name: 'string',
  roles: 'object',
  guards: 'object',
  options: 'object'
};

/**
 * Create the auth loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createAuthLoader = (options = {}) => {
  const loader = createLoader('auth', {
    ...options,
    patterns: AUTH_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const authObj = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      return validationHook(authObj, authSchema);
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const authObj = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      // Inject context/services if needed
      return contextInjectionHook(authObj, { services: context?.services, config: context?.config });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading auth modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 