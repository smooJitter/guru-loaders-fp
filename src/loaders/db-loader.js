import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for database configs
const DB_PATTERNS = {
  default: '**/*.db.js',
  index: '**/db/**/*.index.js'
};

// Database validation schema
const dbSchema = {
  name: 'string',
  connection: 'object',
  stop: ['function', 'undefined'],
  options: ['object', 'undefined']
};

// Extract db config(s) from a module (factory or object/array, async supported)
const extractDbs = async (module, context) => {
  if (!module || typeof module !== 'object') return [];
  const mod = module.default || module;
  const dbs = typeof mod === 'function' ? await mod(context) : mod;
  return Array.isArray(dbs) ? dbs : [dbs];
};

export const createDbLoader = (options = {}) => {
  const patterns = options.patterns || DB_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading database modules');
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
        try {
          const dbs = await extractDbs(modules[i], context);
          for (const db of dbs) {
            validationHook(db, dbSchema);
            const injected = contextInjectionHook(db, { services: context?.services });
            const finalObj = {
              ...injected,
              type: 'db',
              timestamp: Date.now()
            };
            if (finalObj.name) {
              if (registry[finalObj.name]) {
                logger.warn && logger.warn('[db-loader] Duplicate db names found:', [finalObj.name]);
              }
              registry[finalObj.name] = finalObj;
            } else {
              throw new Error('Missing name property');
            }
          }
        } catch (err) {
          logger.warn && logger.warn(`[db-loader] Invalid or missing db in file: ${files[i]}: ${err.message}`);
        }
      }
      context.dbs = registry;
      logger.info && logger.info(`[db-loader] Loaded dbs: ${Object.keys(registry).join(', ')}`);
      return { context };
    }, context);
  };
}; 