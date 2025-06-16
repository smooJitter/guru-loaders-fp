import { createLoader } from '../utils/loader-utils.js';
import mongoose from 'mongoose';

const MODEL_PATTERNS = [
  '**/*.model.js',
  '**/models/**/*.index.js'
];

/**
 * Extract a model from a module (either direct export or factory)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object|undefined} The Mongoose model or undefined
 */
export const extractModel = (module, ctx) => {
  const mongooseConnection = ctx?.mongooseConnection || mongoose;
  if (!module || typeof module !== 'object') return undefined;
  let model;
  if (typeof module.default === 'function') {
    model = module.default({ mongooseConnection, additionalPlugins: [] });
  } else {
    model = module.default;
  }
  return model && model.modelName ? model : undefined;
};

/**
 * Validate a model module
 * @param {string} type - The loader type ("models")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateModelModule = (type, module) => {
  const model = extractModel(module, {});
  return !!(model && model.modelName && typeof model.modelName === 'string');
};

export const createModelLoader = (options = {}) =>
  createLoader('models', {
    patterns: options.patterns || MODEL_PATTERNS,
    ...options,
    transform: extractModel,
    validate: validateModelModule
  });

export default createModelLoader(); 