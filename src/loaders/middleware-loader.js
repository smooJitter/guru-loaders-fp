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
    return module.default(context);
  }
  return module.default || module;
};

export const middlewareLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const patterns = options.patterns || MIDDLEWARE_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;
  const logger = getLoaderLogger(ctx, options, 'middleware-loader');

  let files = [];
  try {
    files = findFiles(patterns.default);
  } catch (err) {
    logger.warn('[middleware-loader] Error finding files:', err.message);
    files = [];
  }

  let modules = [];
  try {
    modules = await Promise.all(files.map(file => importModule(file, ctx)));
  } catch (err) {
    logger.warn('[middleware-loader] Error importing modules:', err.message);
    modules = [];
  }

  const registry = {};
  for (let i = 0; i < modules.length; i++) {
    let mwObj;
    try {
      mwObj = extractMiddleware(modules[i], ctx);
      if (!mwObj || typeof mwObj !== 'object') throw new Error('Module did not export a valid object or factory');
      validationHook(mwObj, middlewareSchema);
      // Context injection and transform
      const injected = contextInjectionHook(mwObj, { services: ctx?.services, config: ctx?.config });
      const finalObj = {
        ...injected,
        type: 'middleware',
        timestamp: Date.now()
      };
      if (finalObj.name && typeof finalObj.middleware === 'function') {
        if (registry[finalObj.name]) {
          logger.warn('[middleware-loader] Duplicate middleware names found:', [finalObj.name]);
        }
        registry[finalObj.name] = finalObj;
      } else {
        throw new Error('Missing name or middleware property');
      }
    } catch (err) {
      logger.warn('[middleware-loader] Invalid or missing middleware in file:', files[i], err.message);
    }
  }
  ctx.middleware = registry;
  return { middleware: ctx.middleware };
};

export default middlewareLoader; 