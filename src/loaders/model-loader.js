import { createLoader } from '../utils/loader-utils.js';
import mongoose from 'mongoose';
import { findFiles } from '../utils/file-utils.js';

const MODEL_PATTERNS = [
  '**/*.model.js',
  '**/models/**/*.index.js'
];

/**
 * Extracts and registers a Mongoose model from a module export.
 * Handles both direct model objects and factory functions.
 * Logs duplicate warnings and tracks registered model names for cleanup.
 * @param {object} mod - The imported module
 * @param {object} ctx - Loader context
 * @returns {object|undefined} - The registered model or undefined if invalid
 */
function extractAndRegisterModel(mod, ctx) {
  const mongooseConnection = ctx?.mongooseConnection || mongoose;
  let model;
  // Track registered model names for cleanup
  let registeredNames = ctx._registeredModelNames || new Set();
  try {
    // Direct model export
    if (mod.default && mod.default.modelName && mod.default.schema) {
      if (mongooseConnection.models[mod.default.modelName]) {
        ctx.services?.logger?.warn?.(
          '[model-loader]',
          `Duplicate model name: ${mod.default.modelName} (using existing)`
        );
        model = mongooseConnection.models[mod.default.modelName];
      } else {
        model = mod.default;
      }
      registeredNames.add(mod.default.modelName);
    }
    // Factory export
    else if (typeof mod.default === 'function') {
      const beforeKeys = new Set(Object.keys(mongooseConnection.models));
      let maybeModel;
      try {
        maybeModel = mod.default({ mongooseConnection, ...ctx });
      } catch (err) {
        ctx.services?.logger?.warn?.('[model-loader]', `Error loading model: ${err.message}`);
        return undefined;
      }
      if (maybeModel && maybeModel.modelName && maybeModel.schema) {
        const wasAlreadyRegistered = beforeKeys.has(maybeModel.modelName);
        if (wasAlreadyRegistered) {
          ctx.services?.logger?.warn?.(
            '[model-loader]',
            `Duplicate model name: ${maybeModel.modelName} (using existing)`
          );
          model = mongooseConnection.models[maybeModel.modelName];
        } else {
          model = maybeModel;
        }
        registeredNames.add(maybeModel.modelName);
      } else {
        return undefined;
      }
    }
    // Invalid export
    else {
      return undefined;
    }
    if (model && model.modelName && model.schema) {
      ctx._registeredModelNames = registeredNames;
      return model;
    }
    return undefined;
  } catch (err) {
    ctx.services?.logger?.error?.('[model-loader]', `Error loading model: ${err.message}`);
    return undefined;
  }
}

/**
 * Validates that a value is a real Mongoose model (has modelName and findById).
 * @param {string} type - Loader type ("models")
 * @param {object} model - The model to validate
 * @returns {boolean}
 */
function isValidMongooseModel(type, model) {
  return model && model.modelName && typeof model.findById === 'function';
}

/**
 * Builds a registry of loaded models from the Mongoose connection.
 * Only includes models that were just loaded by name.
 * @param {object[]} modules - Array of loaded model objects
 * @param {object} ctx - Loader context
 * @returns {object} - Registry of models keyed by name
 */
function buildMongooseRegistry(modules, ctx) {
  const mongooseConnection = ctx?.mongooseConnection || mongoose;
  const loadedNames = modules.filter(Boolean).map(m => m.modelName);
  const registry = {};
  for (const name of loadedNames) {
    if (mongooseConnection.models[name]) {
      registry[name] = mongooseConnection.models[name];
    }
  }
  return registry;
}

/**
 * Dynamically loads and registers all Mongoose models in the project.
 * Handles factories, direct exports, duplicate detection, and cleanup.
 * @param {object} ctx - Loader context (should include services.logger and optionally mongooseConnection)
 * @returns {Promise<{models: object, cleanup: function, error: Error|null}>}
 */
export const modelLoader = async (ctx = {}) => {
  const logger = ctx?.services?.logger || console;
  const mongooseConnection = ctx.mongooseConnection || mongoose;
  let error = null;
  let models = {};
  let registeredNames = new Set();
  let cleanup = () => {};

  try {
    // Patch context to track registered model names
    const patchedCtx = { ...ctx, _registeredModelNames: registeredNames };
    // Always use findFiles/importModule from context if present
    const options = {
      ...(ctx.options || {}),
      findFiles: ctx.findFiles || (ctx.options && ctx.options.findFiles),
      importModule: ctx.importModule || (ctx.options && ctx.options.importModule),
    };
    const loader = createLoader('models', {
      patterns: options.patterns || MODEL_PATTERNS,
      findFiles: options.findFiles,
      importModule: options.importModule,
      preTransformFns: [extractAndRegisterModel],
      transform: (m) => m,
      validate: isValidMongooseModel,
      registryBuilder: buildMongooseRegistry,
      logger
    });
    const { context } = await loader(patchedCtx);
    models = context.models || {};
    // Merge in any registered names from context
    registeredNames = patchedCtx._registeredModelNames || registeredNames;
    cleanup = () => {
      for (const name of registeredNames) {
        delete mongooseConnection.models[name];
      }
    };
  } catch (err) {
    error = err;
    logger.error('[model-loader]', err);
  }

  return { models, cleanup, error };
};

export default modelLoader; 