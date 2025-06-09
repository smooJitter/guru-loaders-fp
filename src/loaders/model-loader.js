import * as R from 'ramda';
import mongoose from 'mongoose';
import { loggingHook, errorHandlingHook, lifecycleHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';

// File patterns for models
const MODEL_PATTERNS = {
  default: '**/*.model.js',
  index: '**/models/**/*.index.js'
};

// Extract a model from a module (either direct export or factory)
const extractModel = (module, mongooseConnection) => {
  if (!module || typeof module !== 'object') return undefined;
  let model;
  if (typeof module.default === 'function') {
    model = module.default({ mongooseConnection, additionalPlugins: [] });
  } else {
    model = module.default;
  }
  return model && model.modelName ? model : undefined;
};

// Create model loader with Mongoose connection
export const createModelLoader = (mongooseConnection, options = {}) => {
  const patterns = options.patterns || MODEL_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading models');
      const files = findFiles(patterns.default);
      const modules = await Promise.all(files.map(file => importModule(file, context)));
      const registry = {};
      // Prefer logger from context, then options, then console
      const logger =
        context.logger ||
        (context.services && context.services.logger) ||
        options.logger ||
        console;
      for (let i = 0; i < modules.length; i++) {
        let model;
        try {
          model = extractModel(modules[i], mongooseConnection);
        } catch (err) {
          logger.warn && logger.warn(`[model-loader] Error extracting model from file: ${files[i]}: ${err.message}`);
          continue;
        }
        if (model) {
          registry[model.modelName] = model;
        } else {
          logger.warn && logger.warn(`[model-loader] Invalid or missing model in file: ${files[i]}`);
        }
      }
      context.models = registry;
      await lifecycleHook([() => console.log('Model loader initialized')], context);
      return { context };
    }, context);
  };
}; 