import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for fakers
const FAKER_PATTERNS = {
  default: '**/faker-*.js',
  seed: '**/seed-*.js',
  index: '**/fakers/index.js'
};

// Faker validation schema
const fakerSchema = {
  name: String,
  model: String,
  count: Number,
  data: Function,
  options: Object
};

// Faker validation
const validateFaker = (module) => {
  const { name, model, data } = module;
  return name && 
         model && 
         data && 
         typeof data === 'function';
};

// Faker transformation
const transformFaker = (module) => {
  const { name, model, count = 10, data, options = {} } = module;
  
  return {
    name,
    model,
    count,
    data,
    options,
    type: 'faker',
    timestamp: Date.now(),
    // Add seed phase
    seed: async (context) => {
      const { db } = context;
      const Model = db.models[model];
      
      if (!Model) {
        throw new Error(`Model ${model} not found`);
      }
      
      // Generate fake data
      const fakeData = await data(context);
      const items = Array.isArray(fakeData) ? fakeData : [fakeData];
      
      // Insert data
      await Model.insertMany(items);
      
      return items;
    }
  };
};

// Create faker loader
export const createFakerLoader = (options = {}) => {
  const loader = createLoader('faker', {
    ...options,
    patterns: FAKER_PATTERNS,
    validate: validateFaker,
    transform: transformFaker
  });

  return loader;
}; 