import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for environment configs
const ENV_PATTERNS = {
  default: '**/*.environment.js',
  index: '**/environment/**/*.index.js'
};

// Environment validation schema: only require 'name' (string)
const envSchema = {
  name: 'string'
};

// Extract an env object from a module (factory or object)
const extractEnv = (module, context) => {
  if (!module || typeof module !== 'object') return undefined;
  const mod = module.default || module;
  if (typeof mod === 'function') {
    return mod(context);
  }
  return mod;
};

/**
 * Create the environment loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createEnvLoader = (options = {}) => {
  const patterns = options.patterns || ENV_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading environment modules');
      const files = findFiles ? findFiles(patterns.default) : [];
      const modules = importModule
        ? await Promise.all(files.map(file => importModule(file, context)))
        : [];
      const registry = {};
      const logger =
        context.logger ||
        (context.services && context.services.logger) ||
        options.logger ||
        console;
      for (let i = 0; i < modules.length; i++) {
        let envObj;
        try {
          envObj = await extractEnv(modules[i], context);
          if (!envObj) throw new Error('Module did not export a valid object or factory');
          validationHook(envObj, envSchema);
          // Context injection and transform
          const injected = contextInjectionHook(envObj, { services: context?.services });
          const finalObj = {
            ...injected,
            type: 'env',
            timestamp: Date.now()
          };
          if (finalObj.name) {
            if (registry[finalObj.name]) {
              logger.warn && logger.warn('[env-loader] Duplicate env names found:', [finalObj.name]);
            }
            registry[finalObj.name] = finalObj;
          } else {
            throw new Error('Missing name property');
          }
        } catch (err) {
          logger.warn && logger.warn(`[env-loader] Invalid or missing env in file: ${files[i]}: ${err.message}`);
        }
      }
      context.envs = registry;
      return { context };
    }, context);
  };
}; 