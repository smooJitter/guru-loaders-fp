import { createLoader } from '../utils/loader-utils.js';

const PUBSUB_PATTERNS = [
  '**/*.pubsub.js',
  '**/pubsub/**/*.index.js'
];

/**
 * Extract and transform pubsub module(s)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object[]} Array of pubsub objects
 */
export const extractPubsub = (module, ctx) => {
  if (!module || typeof module !== 'object') return [];
  let pubsubObjs;
  if (typeof module.default === 'function') {
    pubsubObjs = module.default({ services: ctx?.services, config: ctx?.config });
  } else {
    pubsubObjs = module.default;
  }
  const pubsubList = Array.isArray(pubsubObjs) ? pubsubObjs : [pubsubObjs];
  return pubsubList
    .filter(Boolean)
    .map(obj => ({
      ...obj,
      type: 'pubsub',
      timestamp: Date.now()
    }));
};

/**
 * Validate a pubsub module
 * @param {string} type - The loader type ("pubsubs")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validatePubsubModule = (type, module) => {
  const pubsubs = extractPubsub(module, {});
  return pubsubs.every(obj => obj && typeof obj.name === 'string');
};

export const createPubsubLoader = (options = {}) =>
  createLoader('pubsubs', {
    patterns: options.patterns || PUBSUB_PATTERNS,
    ...options,
    transform: (module, ctx) => {
      // Flatten array of pubsubs into a registry keyed by name
      const pubsubs = extractPubsub(module, ctx);
      return pubsubs.reduce((acc, obj) => {
        if (obj && obj.name) acc[obj.name] = obj;
        return acc;
      }, {});
    },
    validate: validatePubsubModule
  });

export default createPubsubLoader(); 