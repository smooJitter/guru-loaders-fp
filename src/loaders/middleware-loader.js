import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for middleware
const MIDDLEWARE_PATTERNS = {
  default: '**/middleware/middleware-*.js',
  index: '**/middleware/index.js'
};

// Middleware validation schema
const middlewareSchema = {
  name: String,
  middleware: Function,
  options: Object
};

// Middleware validation
const validateMiddleware = (module) => {
  const { name, middleware } = module;
  return name && 
         middleware && 
         typeof middleware === 'function' && 
         middleware.length >= 3; // Express middleware must have at least 3 params (req, res, next)
};

// Middleware transformation
const transformMiddleware = (module) => {
  const { name, middleware, options = {} } = module;
  return {
    name,
    middleware,
    options,
    type: 'middleware',
    timestamp: Date.now()
  };
};

// Create middleware loader
export const createMiddlewareLoader = (options = {}) => {
  const loader = createLoader('middleware', {
    ...options,
    patterns: MIDDLEWARE_PATTERNS,
    validate: validateMiddleware,
    transform: transformMiddleware
  });

  return loader;
}; 