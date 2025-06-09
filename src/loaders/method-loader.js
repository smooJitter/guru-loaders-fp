// LEGACY: This loader only supports the { name, methods } pattern. Use handler-loader for modern namespaced/array/factory patterns.
// For new code, prefer handler-loader.
//

import { createLoaderWithMiddleware, buildRegistry } from '../utils/loader-utils.js';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { getMethodsFromModule, validateMethodModule } from './lib/method-loader-utils.js';

/**
 * File patterns for methods
 */
const METHOD_PATTERNS = {
  default: '**/*.methods.js',
  index: '**/methods/**/*.index.js'
};

/**
 * Method validation schema (for meta/options, not enforced strictly)
 */
const methodSchema = {
  name: ['string', 'undefined'],
  methods: ['object', 'undefined'],
  meta: ['object', 'undefined'],
  options: ['object', 'undefined']
};

/**
 * Transform a method function into the loader format, injecting context and methods.
 * @param {string} name - Method name
 * @param {function} fn - Method function
 * @param {object} context - Loader context
 * @param {object} methods - All methods
 * @returns {object}
 */
const transformMethod = (name, fn, context, methods) => {
  return {
    name,
    method: (args) => fn({ ...args, context, methods }),
    type: 'methods',
    timestamp: Date.now()
  };
};

/**
 * Create the method loader with robust validation, error reporting, and context injection.
 * Logging is handled through the loggingHook middleware.
 * @param {object} context - Loader context
 * @param {object} methods - All methods
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
const methodLoader = async (context, modules) => {
  // Defensive: always return an object for methods
  const logger = context?.services?.logger;
  const registry = {};
  if (!Array.isArray(modules) || modules.length === 0) {
    context.methods = registry;
    return { context };
  }
  for (const mod of modules) {
    if (!mod || typeof mod !== 'object') {
      logger?.debug?.('[method-loader] Skipping non-object module:', mod);
      logger?.error?.('[method-loader] Invalid module (not an object):', mod);
      continue;
    }
    if (typeof mod.name !== 'string' || typeof mod.methods !== 'object' || mod.methods === null) {
      logger?.error?.('[method-loader] Invalid module shape (expected { name, methods }):', mod);
      continue;
    }
    if (registry[mod.name]) {
      logger?.warn?.(`[method-loader] Duplicate method name: ${mod.name}`);
    }
    // Only include function-valued methods
    const validMethods = Object.entries(mod.methods).filter(([, fn]) => typeof fn === 'function');
    if (validMethods.length === 0) {
      logger?.error?.('[method-loader] No valid method functions found in module:', mod);
    }
    // Register as { method: fn } for legacy compatibility
    registry[mod.name] = {
      method: validMethods.length > 0 ? ((args) => validMethods[0][1]({ ...args, context, methods: registry })) : undefined
    };
  }
  context.methods = registry;
  return { context };
};

export default methodLoader; 