import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for event modules
const EVENT_PATTERNS = {
  default: '**/*.event.js',
  index: '**/events/**/*.index.js'
};

// Event validation schema
const eventSchema = {
  name: 'string',
  handler: 'function',
  options: ['object', 'undefined']
};

// Extract event(s) from a module (factory or object/array)
const extractEvents = (module, context) => {
  if (!module || typeof module !== 'object') return [];
  const mod = module.default || module;
  const events = typeof mod === 'function' ? mod(context) : mod;
  return Array.isArray(events) ? events : [events];
};

export const createEventLoader = (options = {}) => {
  const patterns = options.patterns || EVENT_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading event modules');
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
      let loadedNames = [];
      for (let i = 0; i < modules.length; i++) {
        try {
          const events = extractEvents(modules[i], context);
          for (const event of events) {
            validationHook(event, eventSchema);
            const injected = contextInjectionHook(event, { services: context?.services });
            const finalObj = {
              ...injected,
              type: 'event',
              timestamp: Date.now()
            };
            if (finalObj.name) {
              if (registry[finalObj.name]) {
                logger.warn && logger.warn('[event-loader] Duplicate event names found:', [finalObj.name]);
              }
              registry[finalObj.name] = finalObj;
              loadedNames.push(finalObj.name);
            } else {
              throw new Error('Missing name property');
            }
          }
        } catch (err) {
          logger.warn && logger.warn(`[event-loader] Invalid or missing event in file: ${files[i]}: ${err.message}`);
        }
      }
      context.events = registry;
      logger.info && logger.info(`[event-loader] Loaded events: ${Object.keys(registry).join(', ')}`);
      return { context };
    }, context);
  };
}; 