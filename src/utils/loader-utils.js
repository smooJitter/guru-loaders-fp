import { findFiles, importAndApply, watchFiles } from './file-utils.js';
import { validateModule, validateContext, detectCircularDeps, validateDependencies, validateExports } from './validate-utils.js';
import { pipeAsync } from './async-pipeline-utils.js';
import { mapAsync, filterAsync } from './async-collection-utils.js';
import { assoc, filter, map, reduce } from 'ramda';

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
 * @returns {function} Loader function
 */
export const createLoader = (type, options = {}) => {
  const {
    patterns = [],
    validate = true,
    watch = false,
    logger = console,
    importModule = importAndApply,
    findFiles: findFilesInjected = findFiles,
    detectCircularDeps: detectCircularDepsInjected,
    validateDependencies: validateDependenciesInjected,
    validateExports: validateExportsInjected
  } = options;

  // Use injected or default functions
  const _detectCircularDeps = detectCircularDepsInjected || detectCircularDeps;
  const _validateDependencies = validateDependenciesInjected || validateDependencies;
  const _validateExports = validateExportsInjected || validateExports;

  // Compose validation pipeline
  const validationFns = Array.isArray(validate) ? validate : [validate];
  // Compose transform pipeline
  const transformFns = Array.isArray(options.transform) ? options.transform : [options.transform || ((module, ctx) => module)];

  // Find and load modules
  const loadModules = async (context) => {
    let files = [];
    try {
      files = await findFilesInjected(patterns);
    } catch (err) {
      logger.error(`[${type}-loader] Error finding files:`, err);
      return [];
    }
    const modules = await Promise.all(files.map(async (file) => {
      try {
        return await importModule(file, context);
      } catch (err) {
        logger.warn(`[${type}-loader] Failed to import module ${file}:`, err);
        return null;
      }
    }));
    return filter(Boolean, modules);
  };

  // Validate modules (pipeline)
  const validateModules = async (modules) => {
    return filter(module => {
      let isValid = true;
      for (const fn of validationFns) {
        if (typeof fn === 'function' && !fn(type, module)) {
          isValid = false;
          logger.warn(`[${type}-loader] Module failed validation:`, module);
          break;
        }
      }
      return isValid;
    }, modules);
  };

  // Transform modules (pipeline)
  const transformModules = (modules, context) =>
    map(module =>
      transformFns.reduce((acc, fn) => (typeof fn === 'function' ? fn(acc, context) : acc), module),
      modules
    );

  // Main loader function (pure)
  const loader = async (context) => {
    try {
      await validateContext([type], context);
      const modules = await pipeAsync(
        loadModules,
        validateModules
      )(context);
      if (_detectCircularDeps(modules)) {
        throw new Error(`Circular dependencies detected in ${type} modules`);
      }
      await Promise.all(
        modules.map(module => _validateDependencies(module, context))
      );
      await Promise.all(
        modules.map(module => _validateExports(type, module))
      );
      const transformedModules = transformModules(modules, context);
      const registry = buildRegistry(transformedModules, context, (m, ctx) => m);
      const newContext = assoc(type, registry, context);
      const setupHotReload = (context) => {
        if (!watch) return () => {};
        const cleanup = watchFiles(patterns, async (event, file) => {
          try {
            const module = await importModule(file, context);
            if (validationFns.every(fn => fn(type, module))) {
              const { name, ...rest } = module;
              // Use Ramda to immutably update the registry
              const updatedRegistry = assoc(name, rest, newContext[type]);
              const updatedContext = assoc(type, updatedRegistry, newContext);
              logger.info(`Hot reloaded ${type}: ${name}`);
              // Note: This does not mutate the original context
            }
          } catch (error) {
            logger.error(`Error hot reloading ${type}:`, error);
          }
        });
        return cleanup;
      };
      const cleanup = setupHotReload(newContext);
      return {
        context: newContext,
        cleanup
      };
    } catch (error) {
      logger.error(`Error loading ${type}:`, error);
      throw error;
    }
  };

  return loader;
};

/**
 * Build a registry from an array or object of modules, using Ramda for immutability.
 * @param {Array|Object} modules - The modules to register
 * @param {Object} context - The loader context
 * @param {Function} transformFn - Function to transform each module
 * @returns {Object} The registry object
 */
export function buildRegistry(modules, context, transformFn) {
  const logger = context?.services?.logger;
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
    if (!transformed || typeof transformed !== 'object') {
      logger?.error?.('[buildRegistry] Skipping module with invalid transform:', transformed);
      return null;
    }
    return [transformed.name, transformed];
  }, moduleList));

  // Use Ramda's reduce and assoc for registry creation
  return reduce((registry, [name, mod]) => {
    if (registry[name]) {
      logger?.warn?.(`[buildRegistry] Duplicate module name: ${name}`);
    }
    return assoc(name, mod, registry);
  }, {}, transformedPairs);
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