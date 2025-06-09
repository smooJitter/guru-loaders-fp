import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';

// File patterns for JSON
const JSON_PATTERNS = {
  default: '**/*.json.js',
  index: '**/json/**/*.index.js'
};

// JSON validation schema for the validation hook
const jsonSchema = {
  name: 'string',
  data: 'object',
  options: ['object', 'undefined']
};

// Extract a JSON object from a module (factory or object)
const extractJson = (module, context) => {
  if (!module || typeof module !== 'object') return undefined;
  if (typeof module.default === 'function') {
    return module.default(context);
  }
  return module.default || module;
};

/**
 * Create the JSON loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple JSON objects.
 * Aggregates all JSON objects into a registry keyed by name and attaches to context.jsons.
 * Warns on duplicate names.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createJsonLoader = (options = {}) => {
  const patterns = options.patterns || JSON_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading JSON modules');
      const files = findFiles(patterns.default);
      const modules = await Promise.all(files.map(file => importModule(file, context)));
      const registry = {};
      const logger =
        context.logger ||
        (context.services && context.services.logger) ||
        options.logger ||
        console;
      for (let i = 0; i < modules.length; i++) {
        let jsonObj;
        try {
          jsonObj = extractJson(modules[i], context);
          if (!jsonObj) throw new Error('Module did not export a valid object or factory');
          validationHook(jsonObj, jsonSchema);
          // Context injection and transform
          const injected = contextInjectionHook(jsonObj, { services: context?.services, config: context?.config });
          const finalObj = {
            ...injected,
            type: 'json',
            timestamp: Date.now()
          };
          if (finalObj.name) {
            if (registry[finalObj.name]) {
              logger.warn && logger.warn('[json-loader] Duplicate JSON names found:', [finalObj.name]);
            }
            registry[finalObj.name] = finalObj;
          } else {
            throw new Error('Missing name property');
          }
        } catch (err) {
          logger.warn && logger.warn(`[json-loader] Invalid or missing JSON in file: ${files[i]}: ${err.message}`);
        }
      }
      context.jsons = registry;
      return { context };
    }, context);
  };
}; 