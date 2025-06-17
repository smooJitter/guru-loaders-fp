import { createLoader } from '../utils/loader-utils.js';

const SERVICE_PATTERNS = [
  '**/*.service.js',
  '**/services/**/*.index.js'
];

/**
 * Extract a service object from a module (factory or object)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object|undefined} The service object or undefined
 */
export const extractService = (module, ctx) => {
  if (!module || typeof module !== 'object') return undefined;
  let serviceObj;
  if (typeof module.default === 'function') {
    serviceObj = module.default(ctx);
  } else {
    serviceObj = module.default || module;
  }
  if (!serviceObj) return undefined;
  return {
    ...serviceObj,
    type: 'service',
    timestamp: Date.now()
  };
};

/**
 * Validate a service module
 * @param {string} type - The loader type ("services")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateServiceModule = (type, module) => {
  const svc = extractService(module, {});
  return !!(svc && typeof svc.name === 'string' && typeof svc.service === 'object');
};

export const createServiceLoader = (options = {}) =>
  createLoader('services', {
    patterns: options.patterns || SERVICE_PATTERNS,
    ...options,
    transform: extractService,
    validate: validateServiceModule,
    onDuplicate: (name, ctx) => {
      ctx.logger?.warn('[service-loader]', 'Duplicate service names found:', [name]);
    },
    onInvalid: (module, ctx) => {
      ctx.logger?.warn('[service-loader]', 'Invalid service module:', module);
    }
  });

export const serviceLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createServiceLoader({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  
  const { context } = await loader(ctx);
  
  if (!context.services) {
    context.services = {};
  }
  
  return context;
};

export default serviceLoader; 