import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { getLoaderLogger } from '../utils/loader-logger.js';

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

// Pipeline-friendly plugin loader
export const pluginLoader = async (ctx) => {
  const options = ctx.options || {};
  const patterns = options.patterns || PLUGIN_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;
  const logger = getLoaderLogger(ctx, options, 'plugin-loader');

  return errorHandlingHook(async () => {
    loggingHook(ctx, 'Loading plugin modules');
    let files = findFiles ? findFiles(patterns.default) : [];
    let modules = [];
    try {
      modules = importModule ? await Promise.all(files.map(file => importModule(file, ctx))) : [];
    } catch (err) {
      logger.warn(`[plugin-loader] Error importing plugin files: ${err.message}`);
      modules = [];
    }
    const registry = {};
    for (let i = 0; i < modules.length; i++) {
      try {
        validationHook(modules[i], pluginSchema);
        const injected = contextInjectionHook(modules[i], { services: ctx?.services });
        const finalObj = {
          ...injected,
          type: 'plugin',
          timestamp: Date.now()
        };
        if (finalObj.name) {
          if (registry[finalObj.name]) {
            logger.warn('Duplicate plugin names found:', [finalObj.name]);
          }
          registry[finalObj.name] = finalObj;
        } else {
          throw new Error('Missing name property');
        }
      } catch (err) {
        logger.warn(`Invalid or missing plugin in file: ${files[i]}: ${err.message}`);
      }
    }
    // Return a context-mergeable object
    return { ...ctx, plugins: registry };
  }, ctx);
}; 