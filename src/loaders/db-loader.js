import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for database configs and fakers
const DB_PATTERNS = {
  default: '**/*.db.js',
  index: '**/db/**/*.index.js',
  faker: {
    default: '**/*.faker.js',
    index: '**/faker/**/*.index.js'
  }
};

// Database validation schema for the validation hook
const dbSchema = {
  name: 'string',
  config: 'object',
  options: 'object',
  fakers: 'array' // Optional array of faker configurations
};

/**
 * Create the database loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createDbLoader = (options = {}) => {
  const loader = createLoader('db', {
    ...options,
    patterns: DB_PATTERNS,
    validate: (module) => validationHook(module, dbSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading database modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 