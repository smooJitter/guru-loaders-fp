import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for routes
const ROUTE_PATTERNS = {
  default: '**/routes/**/*.route.js',
  index: '**/routes/index.js'
};

// Route validation schema
const routeSchema = {
  name: String,
  routes: Array,
  options: Object
};

// Route validation
const validateRoute = (module) => {
  const { name, routes } = module;
  return name && Array.isArray(routes);
};

// Route transformation
const transformRoute = (module) => {
  const { name, routes, options = {} } = module;
  return {
    name,
    routes,
    options,
    type: 'routes',
    timestamp: Date.now()
  };
};

// Create route loader
export const createRouteLoader = (options = {}) => {
  const loader = createLoader('routes', {
    ...options,
    patterns: ROUTE_PATTERNS,
    validate: validateRoute,
    transform: transformRoute
  });

  return loader;
}; 