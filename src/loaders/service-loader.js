import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';

// File patterns for services
const SERVICE_PATTERNS = {
  default: '**/*.service.js',
  index: '**/services/**/*.index.js'
};

// Service validation schema
const serviceSchema = {
  name: 'string',
  service: ['function', 'object']
};

// Extract a service object from a module (factory or object)
const extractService = (module, context) => {
  if (!module || typeof module !== 'object') return undefined;
  if (typeof module.default === 'function') {
    return module.default({ services: context?.services, config: context?.config });
  }
  return module.default || module;
};

/**
 * Create the service loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createServiceLoader = (options = {}) => {
  const patterns = options.patterns || SERVICE_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading service modules');
      const files = findFiles(patterns.default);
      const modules = await Promise.all(files.map(file => importModule(file, context)));
      const registry = {};
      const logger =
        context.logger ||
        (context.services && context.services.logger) ||
        options.logger ||
        console;
      for (let i = 0; i < modules.length; i++) {
        let serviceObj;
        try {
          serviceObj = extractService(modules[i], context);
          if (!serviceObj) throw new Error('Module did not export a valid object or factory');
          validationHook(serviceObj, serviceSchema);
          // Context injection and transform
          const injected = contextInjectionHook(serviceObj, { services: context?.services, config: context?.config });
          const finalObj = {
            ...injected,
            type: 'service',
            timestamp: Date.now()
          };
          if (finalObj.name && finalObj.service) {
            if (registry[finalObj.name]) {
              logger.warn && logger.warn('[service-loader] Duplicate service names found:', [finalObj.name]);
            }
            registry[finalObj.name] = finalObj.service; // Only the singleton service object
          } else {
            throw new Error('Missing name or service property');
          }
        } catch (err) {
          logger.warn && logger.warn(`[service-loader] Invalid or missing service in file: ${files[i]}: ${err.message}`);
        }
      }
      context.services = registry;
      return { context };
    }, context);
  };
}; 