import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// JSON validation schema
const jsonSchema = {
  name: String,
  data: Object,
  options: Object
};

// JSON validation
const validateJson = (module) => {
  const { name, data } = module;
  return name && data && typeof data === 'object';
};

// JSON transformation
const transformJson = (module) => {
  const { name, data, options = {} } = module;
  return {
    name,
    data,
    options,
    type: 'json',
    timestamp: Date.now()
  };
};

// Create JSON loader
export const createJsonLoader = (options = {}) => {
  const loader = createLoader('json', {
    ...options,
    validate: validateJson,
    transform: transformJson
  });

  return loader;
}; 