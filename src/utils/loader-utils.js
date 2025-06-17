import { findFiles, importAndApply, watchFiles } from './file-utils.js';
import { validateModule, validateContext, detectCircularDeps, validateDependencies, validateExports } from './validate-utils.js';
import { pipeAsync } from './async-pipeline-utils.js';
import { mapAsync, filterAsync } from './async-collection-utils.js';
import { assoc, filter, map, reduce, flatten } from 'ramda';

/**
 * Create a robust, extensible, and pure loader for modules of a given type.
 * This implementation is fully functional and never mutates the input context.
 * @param {string} type - The registry type (e.g., 'actions', 'handlers', 'envs', etc.)
 * @param {object} options - Loader options
 * @param {string[]} [options.patterns] - Glob patterns for file discovery
 * @param {function|function[]} [options.validate] - Validation function(s) for modules
 * @param {function|function[]} [options.transform] - Transform function(s) for modules
 * @param {boolean} [options.watch] - Enable hot reloading
 * @param {object} [options.logger] - Logger object (default: console)
 * @param {function} [options.importModule] - Module import function
 * @param {function} [options.findFiles] - File finding function
 * @param {function} [options.detectCircularDeps] - Circular dependency detection
 * @param {function} [options.validateDependencies] - Dependency validation
 * @param {function} [options.validateExports] - Export validation
 * @param {function[]} [options.preTransformFns] - Pre-transform functions for modules
 * @param {function} [options.registryBuilder] - Custom registry builder function
 * @param {function} [options.onDuplicate] - Called when a duplicate module is found
 * @param {function} [options.onInvalid] - Called when an invalid module is found
 * @returns {function} Loader function
 */
export const createLoader = (type, options) => {
  const {
    patterns = [],
    validate = () => true,
    transform = (m) => m,
    watch = false,
    logger = console,
    importModule = importAndApply,
    findFiles: findFilesFn = findFiles,
    onDuplicate = () => {},
    onInvalid = () => {}
  } = options;

  return async (ctx) => {
    const context = { ...ctx };
    const registry = context[type] || {};
    
    try {
      // Find files
      const files = await findFilesFn(patterns);
      
      // Import and process modules
      const modules = await Promise.all(
        files.map(async (file) => {
          try {
            const module = await importModule(file, context);
            if (!module) return null;
            
            // Transform module
            const transformed = transform(module, context);
            if (!transformed) return null;
            
            // Validate module
            if (!validate(type, transformed)) {
              onInvalid(transformed, context);
              return null;
            }
            
            // Check for duplicates
            if (registry[transformed.name]) {
              onDuplicate(transformed.name, context);
            }
            
            return transformed;
          } catch (err) {
            logger.warn(`[${type}-loader] Error processing ${file}:`, err);
            return null;
          }
        })
      );
      
      // Build registry
      const validModules = modules.filter(Boolean);
      const newRegistry = validModules.reduce((reg, module) => {
        reg[module.name] = module.service || module;
        return reg;
      }, {});
      
      // Update context
      context[type] = { ...registry, ...newRegistry };
      
      // Setup watch if enabled
      let cleanup = () => {};
      if (watch) {
        cleanup = await watchFiles(patterns, async () => {
          const { context: newContext } = await createLoader(type, options)(context);
          Object.assign(context, newContext);
        });
      }
      
      return { context, cleanup };
    } catch (err) {
      logger.error(`[${type}-loader] Error:`, err);
      return { context, cleanup: () => {} };
    }
  };
};

/**
 * Build a registry from an array or object of modules, using Ramda for immutability.
 * @param {Array|Object} modules - The modules to register
 * @param {Object} context - The loader context
 * @param {Function} transformFn - Function to transform each module
 * @returns {Object} The registry object
 */
export function buildRegistry(modules, context, transformFn) {
  const logger = (context && (context.logger || (context.services && context.services.logger))) || console;
  if (!modules || (typeof modules !== 'object' && !Array.isArray(modules))) {
    logger?.debug?.('[buildRegistry] Input is not an array/object, returning empty registry:', modules);
    return {};
  }
  const moduleList = Array.isArray(modules)
    ? modules
    : filter(m => m && typeof m === 'object', Object.values(modules));

  // Use Ramda's map to transform and filter
  const transformedPairs = filter(Boolean, map(module => {
    if (!module || typeof module !== 'object') {
      logger?.debug?.('[buildRegistry] Skipping non-object module:', module);
      return null;
    }
    if (!module.name || typeof module.name !== 'string') {
      logger?.error?.('[buildRegistry] Skipping module missing name:', module);
      return null;
    }
    const transformed = transformFn ? transformFn(module, context) : module;
    return [module.name, transformed];
  }, moduleList));

  // Warn on duplicates
  const registry = reduce((registry, [name, mod]) => {
    if (registry[name]) {
      logger?.warn?.(`[buildRegistry] Duplicate module name: ${name}`);
    }
    return assoc(name, mod, registry);
  }, {}, transformedPairs);
  return registry;
}

/**
 * Check if a registry is in the modern namespaced format.
 * @param {Object} registry - The registry object to check
 * @returns {boolean} True if the registry is modern, false otherwise
 */
export const isModernRegistry = (registry) =>
  registry &&
  typeof registry === 'object' &&
  Object.values(registry).every(
    ns =>
      typeof ns === 'object' &&
      Object.values(ns).every(fn => typeof fn === 'function' || (typeof fn === 'object' && typeof fn.method === 'function'))
  );

/**
 * Create a loader with plugins (before/after hooks).
 * @param {string} type - The registry type
 * @param {Array} plugins - Array of plugin objects with before/after hooks
 * @param {Object} options - Loader options
 * @returns {function} Loader function with plugins
 */
export const createLoaderWithPlugins = (type, plugins = [], options = {}) => {
  const loader = createLoader(type, options);

  return async (context) => {
    // Run before plugins
    const beforeContext = await pipeAsync(
      ...plugins.map(plugin => plugin.before || R.identity)
    )(context);

    // Run loader
    const { context: loaderContext, cleanup } = await loader(beforeContext);

    // Run after plugins
    const afterContext = await pipeAsync(
      ...plugins.map(plugin => plugin.after || R.identity)
    )(loaderContext);

    return {
      context: afterContext,
      cleanup
    };
  };
};

/**
 * Create a loader with middleware (pipeline steps).
 * @param {string} type - The registry type
 * @param {Array} middleware - Array of middleware functions
 * @param {Object} options - Loader options
 * @returns {function} Loader function with middleware
 */
export const createLoaderWithMiddleware = (type, middleware = [], options = {}) => {
  const loader = createLoader(type, options);

  return async (context) => {
    // Run middleware
    const middlewareContext = await pipeAsync(
      ...middleware
    )(context);

    // Run loader
    const { context: loaderContext, cleanup } = await loader(middlewareContext);

    return {
      context: loaderContext,
      cleanup
    };
  };
};

/**
 * Create a loader with additional validation steps.
 * @param {string} type - The registry type
 * @param {Array} validators - Array of validator functions
 * @param {Object} options - Loader options
 * @returns {function} Loader function with validation
 */
export const createLoaderWithValidation = (type, validators = [], options = {}) => {
  const loader = createLoader(type, options);

  return async (context) => {
    // Run validators
    await Promise.all(
      validators.map(validator => validator(context))
    );

    // Run loader
    const { context: loaderContext, cleanup } = await loader(context);

    return {
      context: loaderContext,
      cleanup
    };
  };
};

/**
 * Create a loader with transformation steps.
 * @param {string} type - The registry type
 * @param {Array} transformers - Array of transformer functions
 * @param {Object} options - Loader options
 * @returns {function} Loader function with transformation
 */
export const createLoaderWithTransformation = (type, transformers = [], options = {}) => {
  const loader = createLoader(type, options);

  return async (context) => {
    // Run transformers
    const transformedContext = await pipeAsync(
      ...transformers
    )(context);

    // Run loader
    const { context: loaderContext, cleanup } = await loader(transformedContext);

    return {
      context: loaderContext,
      cleanup
    };
  };
};