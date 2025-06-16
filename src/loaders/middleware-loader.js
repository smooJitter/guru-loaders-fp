import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';
import { getLoaderLogger } from '../utils/loader-logger.js';

// File patterns for middleware
const MIDDLEWARE_PATTERNS = {
  default: '**/*.middleware.js',
  index: '**/middleware/**/*.index.js'
};

// Middleware validation schema for the validation hook
const middlewareSchema = {
  name: 'string',
  middleware: 'function',
  options: ['object', 'undefined']
};

// Extract a middleware object from a module (factory or object)
const extractMiddleware = (module, context) => {
  if (!module || typeof module !== 'object') return undefined;
  if (typeof module.default === 'function') {
    return module.default({ services: context?.services, config: context?.config });
  }
  return module.default || module;
};

// Pipeline-friendly middleware loader
export const middlewareLoader = async (ctx) => {
  const options = ctx.options || {};
  const patterns = options.patterns || MIDDLEWARE_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;
  const logger = getLoaderLogger(ctx, options, 'middleware-loader');

  return errorHandlingHook(async () => {
    loggingHook(ctx, 'Loading middleware modules');
    let files = findFiles(patterns.default);
    let modules = [];
    try {
      modules = await Promise.all(files.map(file => importModule(file, ctx)));
    } catch (err) {
      logger.warn(`[middleware-loader] Error importing middleware files: ${err.message}`);
      modules = [];
    }
    const registry = {};
    for (let i = 0; i < modules.length; i++) {
      let mwObj;
      try {
        mwObj = extractMiddleware(modules[i], ctx);
        if (!mwObj) throw new Error('Module did not export a valid object or factory');
        validationHook(mwObj, middlewareSchema);
        // Context injection and transform
        const injected = contextInjectionHook(mwObj, { services: ctx?.services, config: ctx?.config });
        const finalObj = {
          ...injected,
          type: 'middleware',
          timestamp: Date.now()
        };
        if (finalObj.name && finalObj.middleware) {
          if (registry[finalObj.name]) {
            logger.warn('Duplicate middleware names found:', [finalObj.name]);
          }
          registry[finalObj.name] = finalObj;
        } else {
          throw new Error('Missing name or middleware property');
        }
      } catch (err) {
        logger.warn(`Invalid or missing middleware in file: ${files[i]}: ${err.message}`);
      }
    }
    // Return a context-mergeable object
    return { ...ctx, middleware: registry };
  }, ctx);
}; 