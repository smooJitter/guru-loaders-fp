import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// Event patterns for file discovery
const EVENT_PATTERNS = {
  default: '**/*-event.js',
  index: '**/events/**/index.js'
};

// Event validation schema for the validation hook
const eventSchema = {
  name: 'string',
  handler: 'function',
  options: 'object'
};

/**
 * Create the event loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createEventLoader = (options = {}) => {
  const loader = createLoader('event', {
    ...options,
    patterns: EVENT_PATTERNS,
    validate: (module) => validationHook(module, eventSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading event modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 