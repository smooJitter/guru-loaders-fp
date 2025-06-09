import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';

// File patterns for SDL files
const SDL_PATTERNS = {
  default: '**/*.sdl.js',
  index: '**/sdl/**/*.index.js'
};

// SDL validation schema
const sdlSchema = {
  name: 'string',
  schema: 'string',
  buildSchema: ['function', 'undefined'],
  options: ['object', 'undefined']
};

// Extract SDL(s) from a module (factory or object/array)
const extractSdls = (module, context) => {
  if (!module || typeof module !== 'object') return [];
  const mod = module.default || module;
  const sdls = typeof mod === 'function' ? mod(context) : mod;
  return Array.isArray(sdls) ? sdls : [sdls];
};

export const createSdlLoader = (options = {}) => {
  const patterns = options.patterns || SDL_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;

  return async (context) => {
    return errorHandlingHook(async () => {
      loggingHook(context, 'Loading SDL modules');
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
          const sdls = extractSdls(modules[i], context);
          for (const sdl of sdls) {
            validationHook(sdl, sdlSchema);
            const injected = contextInjectionHook(sdl, { services: context?.services });
            const finalObj = {
              ...injected,
              type: 'sdl',
              timestamp: Date.now()
            };
            if (finalObj.name) {
              if (registry[finalObj.name]) {
                logger.warn && logger.warn('[sdl-loader] Duplicate SDL names found:', [finalObj.name]);
              }
              registry[finalObj.name] = finalObj;
            } else {
              throw new Error('Missing name property');
            }
          }
        } catch (err) {
          logger.warn && logger.warn(`[sdl-loader] Invalid or missing SDL in file: ${files[i]}: ${err.message}`);
        }
      }
      context.sdls = registry;
      logger.info && logger.info(`[sdl-loader] Loaded SDLs: ${Object.keys(registry).join(', ')}`);
      return { context };
    }, context);
  };
}; 