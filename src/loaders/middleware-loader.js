import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';

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

/**
 * Create the middleware loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple middleware objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createMiddlewareLoader = (options = {}) => {
  const patterns = options.patterns || MIDDLEWARE_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading middleware modules');
      const files = findFiles(patterns.default);
      const modules = await Promise.all(files.map(file => importModule(file, context)));
      const registry = {};
      const logger =
        context.logger ||
        (context.services && context.services.logger) ||
        options.logger ||
        console;
      for (let i = 0; i < modules.length; i++) {
        let mwObj;
        try {
          mwObj = extractMiddleware(modules[i], context);
          if (!mwObj) throw new Error('Module did not export a valid object or factory');
          validationHook(mwObj, middlewareSchema);
          // Context injection and transform
          const injected = contextInjectionHook(mwObj, { services: context?.services, config: context?.config });
          const finalObj = {
            ...injected,
            type: 'middleware',
            timestamp: Date.now()
          };
          if (finalObj.name && finalObj.middleware) {
            if (registry[finalObj.name]) {
              logger.warn && logger.warn('[middleware-loader] Duplicate middleware names found:', [finalObj.name]);
            }
            registry[finalObj.name] = finalObj;
          } else {
            throw new Error('Missing name or middleware property');
          }
        } catch (err) {
          logger.warn && logger.warn(`[middleware-loader] Invalid or missing middleware in file: ${files[i]}: ${err.message}`);
        }
      }
      context.middleware = registry;
      return { context };
    }, context);
  };
}; 