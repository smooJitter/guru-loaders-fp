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
  options: ['object', 'undefined']
};

/**
 * Create the pubsub loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple pubsub objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createPubsubLoader = (options = {}) => {
  const loader = createLoader('pubsub', {
    ...options,
    patterns: PUBSUB_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const pubsubObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const pubsubList = Array.isArray(pubsubObjs) ? pubsubObjs : [pubsubObjs];
      // Validate all pubsub objects in the array
      return pubsubList.every(pubsubObj => validationHook(pubsubObj, pubsubSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const pubsubObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const pubsubList = Array.isArray(pubsubObjs) ? pubsubObjs : [pubsubObjs];
      // Inject context/services if needed
      return pubsubList.map(pubsubObj => {
        const injected = contextInjectionHook(pubsubObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'pubsub',
          timestamp: Date.now()
        };
      });
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