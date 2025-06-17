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
 * @param {object} ctx - The loader context
 * @returns {boolean} True if valid, false otherwise
 */
export const validatePubsubModule = (type, module, ctx = {}) => {
  const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
  const pubsubs = extractPubsub(module, ctx);
  const allValid = pubsubs.every(obj => obj && typeof obj.name === 'string');
  if (!allValid) {
    logger.warn?.('[pubsubs-loader] Dropped invalid pubsub object during validation.', pubsubs);
  }
  return allValid;
};

export const createPubsubLoader = (options = {}) =>
  createLoader('pubsubs', {
    patterns: options.patterns || PUBSUB_PATTERNS,
    ...options,
    transform: (modules, ctx) => {
      const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
      const pubsubs = {};

      for (const module of modules) {
        const pubsubList = extractPubsub(module, ctx);
        for (const obj of pubsubList) {
          if (!obj || typeof obj.name !== 'string') {
            logger.warn?.('[pubsubs-loader] Dropped invalid pubsub object during transform (missing name).', obj);
            continue;
          }
          if (typeof obj.topic !== 'string') {
            logger.warn?.('[pubsubs-loader] Pubsub object has invalid topic (not a string).', obj);
          }
          if (pubsubs[obj.name]) {
            logger.warn?.(`[pubsubs-loader] Duplicate pubsub name: ${obj.name}`);
          }
          pubsubs[obj.name] = obj;
        }
      }

      return pubsubs;
    },
    validate: (type, module, ctx) => validatePubsubModule(type, module, ctx)
  });

export const pubsubLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createPubsubLoader({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  const { context } = await loader(ctx);
  return { pubsubs: context.pubsubs || {} };
};
export default pubsubLoader; 