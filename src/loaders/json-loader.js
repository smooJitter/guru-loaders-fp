import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';
import { getLoaderLogger } from '../utils/loader-logger.js';

// File patterns for JSON modules
const JSON_PATTERNS = {
  default: '**/*.json.js',
  index: '**/json/**/*.index.js'
};

// JSON validation schema
const jsonSchema = {
  name: 'string',
  value: ['object', 'array', 'string', 'number', 'boolean', 'undefined'],
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

// Pipeline-friendly json loader
export const jsonLoader = async (ctx) => {
  const options = ctx.options || {};
  const patterns = options.patterns || JSON_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;
  const logger = getLoaderLogger(ctx, options, 'json-loader');

  return errorHandlingHook(async () => {
    loggingHook(ctx, 'Loading JSON modules');
    let files = findFiles(patterns.default);
    let modules = [];
    try {
      modules = await Promise.all(files.map(file => importModule(file, ctx)));
    } catch (err) {
      logger.warn(`[json-loader] Error importing JSON files: ${err.message}`);
      modules = [];
    }
    const registry = {};
    for (let i = 0; i < modules.length; i++) {
      let jsonObj;
      try {
        jsonObj = extractJson(modules[i], ctx);
        if (!jsonObj) throw new Error('Module did not export a valid object or factory');
        validationHook(jsonObj, jsonSchema);
        // Context injection and transform
        const injected = contextInjectionHook(jsonObj, { services: ctx?.services });
        const finalObj = {
          ...injected,
          type: 'json',
          timestamp: Date.now()
        };
        if (finalObj.name) {
          if (registry[finalObj.name]) {
            logger.warn('Duplicate JSON names found:', [finalObj.name]);
          }
          registry[finalObj.name] = finalObj;
        } else {
          throw new Error('Missing name property');
        }
      } catch (err) {
        logger.warn(`Invalid or missing JSON in file: ${files[i]}: ${err.message}`);
      }
    }
    // Return a context-mergeable object
    return { ...ctx, jsons: registry };
  }, ctx);
}; 