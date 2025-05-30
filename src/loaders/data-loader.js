import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for data loaders
const DATA_PATTERNS = {
  default: '**/data-*.js',
  index: '**/data/index.js'
};

// Data loader validation schema
const dataLoaderSchema = {
  name: String,
  model: String,
  batchFn: Function,
  options: Object
};

// Data loader validation
const validateDataLoader = (module) => {
  const { name, model, batchFn } = module;
  return name && 
         model && 
         batchFn && 
         typeof batchFn === 'function';
};

// Data loader transformation
const transformDataLoader = (module) => {
  const { name, model, batchFn, options = {} } = module;
  
  return {
    name,
    model,
    batchFn,
    options,
    type: 'data',
    timestamp: Date.now(),
    // Create DataLoader instance
    create: (context) => {
      const { cache, DataLoader } = context.services;
      
      if (!DataLoader) {
        throw new Error('DataLoader service not found in context');
      }
      
      return new DataLoader(
        async (keys) => {
          try {
            // Execute batch function
            const results = await batchFn(keys, context);
            
            // Ensure results match keys order
            return keys.map(key => 
              results.find(result => 
                result._id.toString() === key.toString()
              ) || null
            );
          } catch (error) {
            context.logger.error(`Error in ${name} batch function:`, error);
            throw error;
          }
        },
        {
          // Cache options
          cache: options.cache !== false,
          cacheKeyFn: options.cacheKeyFn || (key => key.toString()),
          // Batch options
          batch: options.batch !== false,
          maxBatchSize: options.maxBatchSize || 100,
          // Cache TTL
          ttl: options.ttl || 60000, // 1 minute default
          // Custom cache instance
          cacheMap: cache
        }
      );
    }
  };
};

// Create data loader
export const createDataLoader = (options = {}) => {
  const loader = createLoader('data', {
    ...options,
    patterns: DATA_PATTERNS,
    validate: validateDataLoader,
    transform: transformDataLoader
  });

  return loader;
}; 