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
  options: ['object', 'undefined']
};

/**
 * Create the event loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function returning a single event or an array of events.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createEventLoader = (options = {}) => {
  const loader = createLoader('event', {
    ...options,
    patterns: EVENT_PATTERNS,
    validate: (module, context) => {
      // Call the factory with context/services for validation
      const events = typeof module.default === 'function'
        ? module.default({ services: context?.services })
        : module.default;
      const eventList = Array.isArray(events) ? events : [events];
      // Validate all events in the array
      return eventList.every(event => validationHook(event, eventSchema));
    },
    transform: (module, context) => {
      // Call the factory with context/services for transformation
      const events = typeof module.default === 'function'
        ? module.default({ services: context?.services })
        : module.default;
      const eventList = Array.isArray(events) ? events : [events];
      // Inject context into each event handler if needed
      return eventList.map(event => {
        const injected = contextInjectionHook(event, { services: context?.services });
        return {
          ...injected,
          type: 'event',
          timestamp: Date.now()
        };
      });
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