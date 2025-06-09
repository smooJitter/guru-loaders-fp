import * as R from 'ramda';
import { pipeAsync } from '../../utils/async-pipeline-utils.js';
import { mapAsync, filterAsync } from '../../utils/async-collection-utils.js';
import { findFiles as defaultFindFiles } from '../../utils/file-utils.js';
import { validateModule as defaultValidateModule, detectCircularDeps as defaultDetectCircularDeps, validateDependencies as defaultValidateDependencies, validateExports as defaultValidateExports } from '../../utils/validate-utils.js';

// Create loader factory
export const createLoader = R.curry((type, options = {}) => {
  const {
    patterns = [`**/*.${type}.js`],
    watch = false,
    plugins = [],
    logger = console,
    importModule = (file) => import(file), // default to dynamic import
    findFiles = defaultFindFiles, // allow injection for testability
    validateModule = defaultValidateModule,
    detectCircularDeps = defaultDetectCircularDeps,
    validateDependencies = defaultValidateDependencies,
    validateExports = defaultValidateExports
  } = options;

  // Create base pipeline steps
  const steps = {
    // Find files
    findFiles: async (context) => {
      const files = findFiles(patterns);
      return { ...context, files };
    },

    // Load modules
    loadModules: async (context) => {
      const { files } = context;
      const modules = await mapAsync(
        file => importModule(file).then(m => m.default)
      )(files);
      return { ...context, modules };
    },

    // Process modules
    processModules: async (context) => {
      const { modules } = context;
      
      // Validate modules
      const validModules = await filterAsync(
        module => validateModule(type, module)
      )(modules);

      // Check for circular dependencies
      if (detectCircularDeps(validModules)) {
        throw new Error(`Circular dependencies detected in ${type} modules`);
      }

      // Validate dependencies and exports
      await Promise.all([
        ...validModules.map(module => validateDependencies(module, context)),
        ...validModules.map(module => validateExports(type, module))
      ]);

      return { ...context, modules: validModules };
    },

    // Update context
    updateContext: async (context) => {
      const { modules } = context;
      
      // Create registry
      const registry = modules.reduce((acc, { name, ...rest }) => ({
        ...acc,
        [name]: rest
      }), {});

      // Setup hot reload if needed
      const cleanup = watch ? () => {
        // TODO: Implement hot reload
        logger.info(`Hot reload enabled for ${type}`);
      } : () => {};

      return {
        ...context,
        [type]: registry,
        watchers: {
          ...context.watchers,
          [type]: cleanup
        }
      };
    }
  };

  // Create pipeline with plugin support
  const pipeline = async (context) => {
    try {
      // Run before plugins
      const beforeContext = await pipeAsync(
        ...plugins.map(plugin => plugin.before || R.identity)
      )(context);

      // Run pipeline steps
      const result = await pipeAsync(
        steps.findFiles,
        steps.loadModules,
        steps.processModules,
        steps.updateContext
      )(beforeContext);

      // Run after plugins
      return pipeAsync(
        ...plugins.map(plugin => plugin.after || R.identity)
      )(result);
    } catch (error) {
      if (typeof logger.error === 'function') {
        logger.error(`Error in ${type} loader:`, error);
      } else {
        console.error(`Error in ${type} loader:`, error);
      }
      throw error;
    }
  };

  return pipeline;
}); 