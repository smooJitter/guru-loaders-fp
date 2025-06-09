import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for plugins
const PLUGIN_PATTERNS = {
  default: '**/*.plugin.js',
  index: '**/plugin/**/*.index.js'
};

// Plugin validation schema for the validation hook
const pluginSchema = {
  name: 'string',
  version: 'string',
  hooks: 'object',
  options: 'object'
};

/**
 * Create the plugin loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createPluginLoader = (options = {}) => {
  const loader = createLoader('plugin', {
    ...options,
    patterns: PLUGIN_PATTERNS,
    validate: (module) => validationHook(module, pluginSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading plugin modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 