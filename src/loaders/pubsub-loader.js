import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for pubsub
const PUBSUB_PATTERNS = {
  default: '**/*.pubsub.js',
  index: '**/pubsub/**/*.index.js'
};

// PubSub validation schema for the validation hook
const pubsubSchema = {
  name: 'string',
  topics: ['object', 'undefined'], // Unique: topics registry for pubsub
  handlers: ['object', 'undefined'], // Unique: handler functions for each topic/event
  pubsub: ['object', 'undefined'], // Optional: direct PubSub engine instance (e.g., Apollo PubSub)
  options: ['object', 'undefined']
};

/**
 * Create the pubsub loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple pubsub objects.
 * Aggregates all pubsub objects into a registry keyed by name and attaches to context.pubsubs.
 * Warns on duplicate names.
 * Unique features: topics registry, handler mapping, options for pubsub engine.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createPubsubLoader = (options = {}) => {
  const patterns = options.patterns || PUBSUB_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading pubsub modules');
      const files = findFiles ? findFiles(patterns.default) : [];
      const modules = importModule
        ? await Promise.all(files.map(file => importModule(file, context)))
        : [];
      const logger =
        context.logger ||
        (context.services && context.services.logger) ||
        options.logger ||
        console;
      // Aggregate all loaded pubsub objects into a registry keyed by name
      let allPubsubs = {};
      let allPubsubObjs = [];
      for (let i = 0; i < modules.length; i++) {
        let pubsubObjs;
        try {
          pubsubObjs = typeof modules[i].default === 'function'
            ? modules[i].default({ services: context?.services, config: context?.config })
            : modules[i].default;
          const pubsubList = Array.isArray(pubsubObjs) ? pubsubObjs : [pubsubObjs];
          for (const pubsubObj of pubsubList) {
            validationHook(pubsubObj, pubsubSchema);
            const injected = contextInjectionHook(pubsubObj, { services: context?.services, config: context?.config });
            const finalObj = {
              ...injected,
              type: 'pubsub',
              timestamp: Date.now()
            };
            if (finalObj.name) {
              if (allPubsubs[finalObj.name]) {
                logger.warn && logger.warn('[pubsub-loader] Duplicate pubsub names found:', [finalObj.name]);
              }
              allPubsubs[finalObj.name] = finalObj;
              allPubsubObjs.push(finalObj);
            } else {
              throw new Error('Missing name property');
            }
          }
        } catch (err) {
          logger.warn && logger.warn(`[pubsub-loader] Invalid or missing pubsub in file: ${files[i]}: ${err.message}`);
        }
      }
      context.pubsubs = allPubsubs;
      return { context };
    }, context);
  };
}; 