import { createLoader, createLoaderWithPlugins, createLoaderWithMiddleware, createLoaderWithValidation, createLoaderWithTransformation } from '../utils/loader-utils.js';
import { getLoaderLogger } from '../utils/loader-logger.js';
import { assoc, reduce } from 'ramda';

// File patterns for database configs
export const DB_PATTERNS = [
  '**/*.db.js',
  '**/db/**/*.index.js'
];

// Database validation schema
const dbSchema = {
  name: 'string',
  connection: 'object',
  stop: ['function', 'undefined'],
  options: ['object', 'undefined']
};

/**
 * Extract db config(s) from a module (factory or object/array, async supported)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {Promise<object[]>} Array of db config objects
 */
export const extractDbConfigs = async (module, ctx) => {
  if (!module || typeof module !== 'object') return [];
  const mod = module.default || module;
  const dbs = typeof mod === 'function' ? await mod(ctx) : mod;
  return Array.isArray(dbs) ? dbs : [dbs];
};

/**
 * Validate a db config module
 * @param {string} type - The loader type ("dbs")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateDbModule = (type, module) => {
  const dbs = Array.isArray(module) ? module : [module];
  return dbs.every(db =>
    db &&
    typeof db.name === 'string' &&
    typeof db.connection === 'object' &&
    (typeof db.stop === 'function' || typeof db.stop === 'undefined') &&
    (typeof db.options === 'object' || typeof db.options === 'undefined')
  );
};

/**
 * Create a robust, extensible db loader.
 * @param {object} options - Loader options (patterns, logger, etc.)
 * @returns {function} Loader function
 */
export const createDbLoader = (options = {}) =>
  createLoader('dbs', {
    patterns: options.patterns || DB_PATTERNS,
    ...options,
    transform: options.transform || (async (module, ctx) => {
      const logger = getLoaderLogger(ctx, options, 'db-loader');
      const dbs = await extractDbConfigs(module, ctx);
      return reduce((acc, db) => {
        if (db && db.name) {
          const finalObj = { ...db, type: 'db', timestamp: Date.now() };
          if (acc[db.name]) logger.warn('Duplicate db names found:', [db.name]);
          return assoc(db.name, finalObj, acc);
        }
        return acc;
      }, {}, dbs);
    }),
    validate: options.validate || validateDbModule
  });

/**
 * Create a db loader with plugins (before/after hooks).
 * @param {Array} plugins - Plugin objects
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createDbLoaderWithPlugins = (plugins = [], options = {}) =>
  createLoaderWithPlugins('dbs', plugins, {
    patterns: options.patterns || DB_PATTERNS,
    ...options,
    transform: options.transform || (async (module, ctx) => {
      const logger = getLoaderLogger(ctx, options, 'db-loader');
      const dbs = await extractDbConfigs(module, ctx);
      return reduce((acc, db) => {
        if (db && db.name) {
          const finalObj = { ...db, type: 'db', timestamp: Date.now() };
          if (acc[db.name]) logger.warn('Duplicate db names found:', [db.name]);
          return assoc(db.name, finalObj, acc);
        }
        return acc;
      }, {}, dbs);
    }),
    validate: options.validate || validateDbModule
  });

/**
 * Create a db loader with middleware (pipeline steps).
 * @param {Array} middleware - Middleware functions
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createDbLoaderWithMiddleware = (middleware = [], options = {}) =>
  createLoaderWithMiddleware('dbs', middleware, {
    patterns: options.patterns || DB_PATTERNS,
    ...options,
    transform: options.transform || (async (module, ctx) => {
      const logger = getLoaderLogger(ctx, options, 'db-loader');
      const dbs = await extractDbConfigs(module, ctx);
      return reduce((acc, db) => {
        if (db && db.name) {
          const finalObj = { ...db, type: 'db', timestamp: Date.now() };
          if (acc[db.name]) logger.warn('Duplicate db names found:', [db.name]);
          return assoc(db.name, finalObj, acc);
        }
        return acc;
      }, {}, dbs);
    }),
    validate: options.validate || validateDbModule
  });

/**
 * Create a db loader with additional validation steps.
 * @param {Array} validators - Validator functions
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createDbLoaderWithValidation = (validators = [], options = {}) =>
  createLoaderWithValidation('dbs', validators, {
    patterns: options.patterns || DB_PATTERNS,
    ...options,
    transform: options.transform || (async (module, ctx) => {
      const logger = getLoaderLogger(ctx, options, 'db-loader');
      const dbs = await extractDbConfigs(module, ctx);
      return reduce((acc, db) => {
        if (db && db.name) {
          const finalObj = { ...db, type: 'db', timestamp: Date.now() };
          if (acc[db.name]) logger.warn('Duplicate db names found:', [db.name]);
          return assoc(db.name, finalObj, acc);
        }
        return acc;
      }, {}, dbs);
    }),
    validate: options.validate || validateDbModule
  });

/**
 * Create a db loader with transformation steps.
 * @param {Array} transformers - Transformer functions
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createDbLoaderWithTransformation = (transformers = [], options = {}) =>
  createLoaderWithTransformation('dbs', transformers, {
    patterns: options.patterns || DB_PATTERNS,
    ...options,
    transform: options.transform || (async (module, ctx) => {
      const logger = getLoaderLogger(ctx, options, 'db-loader');
      const dbs = await extractDbConfigs(module, ctx);
      return reduce((acc, db) => {
        if (db && db.name) {
          const finalObj = { ...db, type: 'db', timestamp: Date.now() };
          if (acc[db.name]) logger.warn('Duplicate db names found:', [db.name]);
          return assoc(db.name, finalObj, acc);
        }
        return acc;
      }, {}, dbs);
    }),
    validate: options.validate || validateDbModule
  }); 