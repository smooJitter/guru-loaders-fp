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
 * @param {object} ctx - The loader context
 * @returns {boolean} True if valid, false otherwise
 */
export const validateRouteModule = (type, module, ctx = {}) => {
  const mod = module.default || module;
  const routeObjs = typeof mod === 'function' ? mod(ctx) : mod;
  const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];
  return routeList.every(obj =>
    obj &&
    typeof obj.name === 'string' &&
    typeof obj.method === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.handler === 'function'
  );
};

export const createRouteLoader = (options = {}) =>
  createLoader('routes', {
    patterns: options.patterns || ROUTE_PATTERNS,
    ...options,
    transform: (modules, ctx) => {
      const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
      const routes = {};

      for (const module of modules) {
        const mod = module.default || module;
        const routeObjs = typeof mod === 'function' ? mod(ctx) : mod;
        const routeList = Array.isArray(routeObjs) ? routeObjs : [routeObjs];

        for (const obj of routeList) {
          if (!obj || typeof obj !== 'object') {
            logger.warn?.('[routes-loader] Dropped invalid route object during transform.', obj);
            continue;
          }

          const valid =
            typeof obj.name === 'string' &&
            typeof obj.method === 'string' &&
            typeof obj.path === 'string' &&
            typeof obj.handler === 'function';

          if (!valid) {
            logger.warn?.('[routes-loader] Dropped invalid route object during transform.', obj);
            continue;
          }

          if (routes[obj.name]) {
            logger.warn?.(`[routes-loader] Duplicate route name: ${obj.name}`);
          }

          routes[obj.name] = {
            ...obj,
            type: 'route',
            timestamp: Date.now()
          };
        }
      }

      return routes;
    },
    validate: (type, module, ctx) => validateRouteModule(type, module, ctx)
  });

export const routeLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createRouteLoader({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  const { context } = await loader(ctx);
  return { routes: context.routes || {} };
};

export default routeLoader; 