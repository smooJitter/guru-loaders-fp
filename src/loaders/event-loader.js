import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { getLoaderLogger } from '../utils/loader-logger.js';

// File patterns for event modules
const EVENT_PATTERNS = {
  default: '**/*.event.js',
  index: '**/events/**/*.index.js'
};

// Event validation schema
const eventSchema = {
  name: 'string',
  event: 'function',
  options: ['object', 'undefined']
};

// Extract event(s) from a module (factory or object/array)
const extractEvents = (module, context) => {
  if (!module || typeof module !== 'object') return [];
  const mod = module.default || module;
  const events = typeof mod === 'function' ? mod(context) : mod;
  return Array.isArray(events) ? events : [events];
};

// Pipeline-friendly event loader
export const eventLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const patterns = options.patterns || EVENT_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;
  const logger = getLoaderLogger(ctx, options, 'event-loader');

  return errorHandlingHook(async () => {
    loggingHook(ctx, 'Loading event modules');
    let files = findFiles ? findFiles(patterns.default) : [];
    let modules = [];
    try {
      modules = await Promise.all(files.map(file => importModule(file, ctx)));
    } catch (err) {
      logger.warn(`[event-loader] Error importing event files: ${err.message}`);
      modules = [];
    }
    const registry = {};
    for (let i = 0; i < modules.length; i++) {
      try {
        const events = extractEvents(modules[i], ctx);
        for (const event of events) {
          validationHook(event, eventSchema);
          const injected = contextInjectionHook(event, { services: ctx?.services });
          const finalObj = {
            ...injected,
            type: 'event',
            timestamp: Date.now()
          };
          if (finalObj.name) {
            if (registry[finalObj.name]) {
              logger.warn('Duplicate event names found:', [finalObj.name]);
            }
            registry[finalObj.name] = finalObj;
          } else {
            throw new Error('Missing name property');
          }
        }
      } catch (err) {
        logger.warn(`Invalid or missing event in file: ${files[i]}: ${err.message}`);
      }
    }
    logger.info && logger.info(`[event-loader] Loaded events: ${Object.keys(registry).join(', ')}`);
    // Return a context-mergeable object
    const context = { ...ctx, events: registry };
    if (!context.events || typeof context.events !== 'object') {
      context.events = {};
    }
    return { events: context.events };
  }, ctx);
};

export default eventLoader; 