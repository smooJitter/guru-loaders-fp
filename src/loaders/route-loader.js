import { createLoader } from '../utils/loader-utils.js';

const ROUTE_PATTERNS = [
  '**/*.route.js',
  '**/routes/**/*.index.js'
];

/**
 * Extract and transform route module(s)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object[]} Array of route objects
 */
export const extractRoute = (module, ctx) => {
  if (!module || typeof module !== 'object') return [];
  let routeObjs;
  const mod = module.default || module;
  routeObjs = typeof mod === 'function' ? mod(ctx) : mod;
  const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
  return routeList
    .filter(Boolean)
    .map(obj => ({
      ...obj,
      type: 'route',
      timestamp: Date.now()
    }));
};

/**
 * Validate a route module
 * @param {string} type - The loader type ("routes")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateRouteModule = (type, module) => {
  const mod = module.default || module;
  const routeObjs = typeof mod === 'function' ? mod({}) : mod;
  const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
  return routeList.every(obj =>
    obj &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.routes)
  );
};

export const createRouteLoader = (options = {}) =>
  createLoader('routes', {
    patterns: options.patterns || ROUTE_PATTERNS,
    ...options,
    transform: (module, ctx) => {
      const mod = module.default || module;
      const routeObjs = typeof mod === 'function' ? mod(ctx) : mod;
      const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
      return routeList
        .filter(Boolean)
        .reduce((acc, obj) => {
          if (obj && obj.name) acc[obj.name] = { ...obj, type: 'route', timestamp: Date.now() };
          return acc;
        }, {});
    },
    validate: validateRouteModule
  });

export default createRouteLoader(); 