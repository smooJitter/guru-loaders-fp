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
  options: 'object'
};

/**
 * Create the faker loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createFakerLoader = (options = {}) => {
  const loader = createLoader('faker', {
    ...options,
    patterns: FAKER_PATTERNS,
    validate: (module) => validationHook(module, fakerSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
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