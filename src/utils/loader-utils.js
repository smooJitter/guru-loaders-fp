import * as R from 'ramda';
import { findFiles, importAndApply, watchFiles } from './file-utils.js';
import { validateModule, validateContext, detectCircularDeps, validateDependencies, validateExports } from './validate-utils.js';
import { pipeAsync, safePipeAsync } from './async-pipeline-utils.js';
import { mapAsync, filterAsync, groupByAsync } from './async-collection-utils.js';

// Create loader
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

  // Find and load modules
  const loadModules = async (context) => {
    const files = findFilesInjected(patterns);
    const modules = await mapAsync(
      file => importModule(file, context)
    )(files);

    return modules;
  };

  // Validate modules
  const validateModules = async (modules) => {
    let validateFn;
    if (typeof options.validate === 'function') {
      validateFn = options.validate;
    } else if (options.validate === false) {
      validateFn = () => true;
    } else {
      validateFn = (type, module) => validateModule(type, module);
    }
    const validModules = await filterAsync(
      module => validateFn(type, module)
    )(modules);

    if (validModules.length !== modules.length) {
      logger.warn(`Some ${type} modules failed validation`);
    }

    return validModules;
  };

  // Main loader function
  const loader = async (context) => {
    try {
      // Validate context
      await validateContext([type], context);

      // Load and validate modules
      const modules = await pipeAsync(
        loadModules,
        validateModules
      )(context);

      // Check for circular dependencies
      if (_detectCircularDeps(modules)) {
        throw new Error(`Circular dependencies detected in ${type} modules`);
      }

      // Validate dependencies
      await Promise.all(
        modules.map(module => _validateDependencies(module, context))
      );

      // Validate exports
      await Promise.all(
        modules.map(module => _validateExports(type, module))
      );

      // Create registry
      const transformFn = options.transform || ((module, ctx) => module);
      const registry = buildRegistry(modules, context, transformFn);

      // Update context
      context[type] = registry;

      // Setup hot reload
      const setupHotReload = (context) => {
        if (!watch) return () => {};

        const cleanup = watchFiles(patterns, async (event, file) => {
          try {
            const module = await importModule(file, context);
            if (validateModule(type, module)) {
              const { name, ...rest } = module;
              context[type] = R.assocPath([name], rest, context[type]);
              logger.info(`Hot reloaded ${type}: ${name}`);
            }
          } catch (error) {
            logger.error(`Error hot reloading ${type}:`, error);
          }
        });

        return cleanup;
      };

      const cleanup = setupHotReload(context);

      return {
        context,
        cleanup
      };
    } catch (error) {
      logger.error(`Error loading ${type}:`, error);
      throw error;
    }
  };

  return loader;
};

// Create loader with plugins
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

// Create loader with middleware
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

// Create loader with validation
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

// Create loader with transformation
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

export function buildRegistry(modules, context, transformFn) {
  // Defensive: always return an object, skip invalid modules, log if possible
  const logger = context?.services?.logger;
  if (!modules || (typeof modules !== 'object' && !Array.isArray(modules))) {
    // Defensive: return empty object instead of throwing
    logger?.debug?.('[buildRegistry] Input is not an array/object, returning empty registry:', modules);
    return {};
  }
  const moduleList = Array.isArray(modules)
    ? modules
    : Object.values(modules).filter(m => m && typeof m === 'object');
  return moduleList
    .map(module => {
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
    })
    .filter(Boolean)
    .reduce((registry, [name, mod]) => {
      if (registry[name]) {
        logger?.warn?.(`[buildRegistry] Duplicate module name: ${name}`);
      }
      registry[name] = mod;
      return registry;
    }, {});
} 