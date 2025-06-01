import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';
import mongoose from 'mongoose';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { lifecycleHook } from '../hooks/lifecycleHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for models
const MODEL_PATTERNS = {
  default: '**/*-model.js',
  index: '**/models/**/index.js'
};

// Model validation schema
const modelSchema = {
  // Can be either a function (factory) or a model
  default: ['function', 'object']
};

// Model validation
const validateModel = (module) => {
  // Valid if it's a factory function or a model
  return typeof module.default === 'function' || 
         (module.default && module.default.modelName);
};

// Model transformation
const transformModel = (module, context) => {
  const { mongooseConnection } = context;
  let model;

  if (typeof module.default === 'function') {
    // Handle factory function pattern
    model = module.default({ mongooseConnection, additionalPlugins: [] });
  } else {
    // Handle direct model export pattern
    model = module.default;
  }

  return {
    name: model.modelName,
    model,
    type: 'model',
    timestamp: Date.now()
  };
};

// Create model loader with Mongoose connection
export const createModelLoader = (mongooseConnection, options = {}) => {
  const loader = createLoader('model', {
    ...options,
    patterns: MODEL_PATTERNS,
    validate: validateModel,
    transform: (module, context) => {
      const modelObject = transformModel(module, { ...context, mongooseConnection });
      return {
        ...modelObject,
        type: 'model',
        timestamp: Date.now()
      };
    }
  });

  return async (context) => {
    // Use logging hook
    loggingHook(context, 'Loading models');

    // Use error handling hook
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);

      // Use lifecycle hook
      await lifecycleHook([() => console.log('Model loader initialized')], loaderContext);

      return {
        context: loaderContext,
        cleanup
      };
    }, context);
  };
}; 