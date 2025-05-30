import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for models
const MODEL_PATTERNS = {
  default: '**/*-model.js',
  index: '**/models/index.js'
};

// Model validation schema
const modelSchema = {
  name: String,
  schema: Object,
  model: Function,
  options: Object
};

// Model validation
const validateModel = (module) => {
  const { name, schema, model } = module;
  return name && schema && model;
};

// Model transformation
const transformModel = (module) => {
  const { name, schema, model, options = {} } = module;
  return {
    name,
    schema,
    model,
    options,
    type: 'model',
    timestamp: Date.now()
  };
};

// Create model loader
export const createModelLoader = (options = {}) => {
  const loader = createLoader('model', {
    ...options,
    patterns: MODEL_PATTERNS,
    validate: validateModel,
    transform: transformModel
  });

  return loader;
}; 