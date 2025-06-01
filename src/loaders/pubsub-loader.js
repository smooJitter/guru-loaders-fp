import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for pubsub
const PUBSUB_PATTERNS = {
  default: '**/*-pubsub.js',
  index: '**/pubsub/**/index.js'
};

// PubSub validation schema for the validation hook
const pubsubSchema = {
  name: 'string',
  topics: 'object',
  handlers: 'object',
  options: 'object'
};

/**
 * Create the pubsub loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createPubsubLoader = (options = {}) => {
  const loader = createLoader('pubsub', {
    ...options,
    patterns: PUBSUB_PATTERNS,
    validate: (module) => validationHook(module, pubsubSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading pubsub modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 