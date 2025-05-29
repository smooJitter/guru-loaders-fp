import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for SDL files
const SDL_PATTERNS = {
  default: '**/schema/**/*.graphql',
  index: '**/schema/index.graphql'
};

// SDL validation schema
const sdlSchema = {
  name: String,
  schema: String,
  buildSchema: Function, // Optional function to build schema with context
  options: Object
};

// SDL validation
const validateSdl = (module) => {
  const { name, schema, buildSchema } = module;
  const hasValidSchema = schema && typeof schema === 'string' &&
    schema.includes('type') && // Basic check for GraphQL SDL
    (schema.includes('Query') || schema.includes('Mutation') || schema.includes('Subscription'));
  
  const hasValidBuilder = !buildSchema || typeof buildSchema === 'function';
  
  return name && (hasValidSchema || hasValidBuilder);
};

// SDL transformation with context injection
const transformSdl = (module) => {
  const { name, schema, buildSchema, options = {} } = module;
  
  return {
    name,
    schema,
    buildSchema, // Include the builder function for context injection
    options,
    type: 'sdl',
    timestamp: Date.now(),
    // Add context dependencies if specified
    contextDeps: options.contextDeps || [],
    // Add schema building phase
    build: async (context) => {
      if (buildSchema) {
        return await buildSchema(context);
      }
      return schema;
    }
  };
};

// Create SDL loader
export const createSdlLoader = (options = {}) => {
  const loader = createLoader('sdl', {
    ...options,
    patterns: SDL_PATTERNS,
    validate: validateSdl,
    transform: transformSdl
  });

  return loader;
}; 