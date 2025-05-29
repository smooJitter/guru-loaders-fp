import R from 'ramda';
import { findFiles, importAndApply, watchFiles } from './file-utils.js';
import { validateModule, validateContext, detectCircularDeps, validateDependencies, validateExports } from './validate-utils.js';
import { pipeAsync, safePipeAsync, mapAsync, filterAsync, groupByAsync } from './fp-utils.js';

// Create loader
export const createLoader = (type, options = {}) => {
  const {
    patterns = [],
    validate = true,
    watch = false,
    logger = console
  } = options;

  // Find and load modules
  const loadModules = async (context) => {
    const files = findFiles(patterns);
    const modules = await mapAsync(
      file => importAndApply(file, context)
    )(files);

    return modules;
  };

  // Validate modules
  const validateModules = async (modules) => {
    if (!validate) return modules;

    const validModules = await filterAsync(
      module => validateModule(type, module)
    )(modules);

    if (validModules.length !== modules.length) {
      logger.warn(`Some ${type} modules failed validation`);
    }

    return validModules;
  };

  // Create registry
  const createRegistry = (modules) => {
    return modules.reduce((registry, module) => {
      const { name, ...rest } = module;
      return R.assocPath([name], rest, registry);
    }, {});
  };

  // Setup hot reload
  const setupHotReload = (context) => {
    if (!watch) return () => {};

    const cleanup = watchFiles(patterns, async (event, file) => {
      try {
        const module = await importAndApply(file, context);
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
      if (detectCircularDeps(modules)) {
        throw new Error(`Circular dependencies detected in ${type} modules`);
      }

      // Validate dependencies
      await Promise.all(
        modules.map(module => validateDependencies(module, context))
      );

      // Validate exports
      await Promise.all(
        modules.map(module => validateExports(type, module))
      );

      // Create registry
      const registry = createRegistry(modules);

      // Update context
      context[type] = registry;

      // Setup hot reload
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