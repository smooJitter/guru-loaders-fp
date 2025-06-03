import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for SDL files
const SDL_PATTERNS = {
  default: '**/*.sdl.js',
  index: '**/sdl/**/*.index.js'
};

// SDL validation schema for the validation hook
const sdlSchema = {
  name: 'string',
  schema: 'string',
  buildSchema: ['function', 'undefined'], // Optional function to build schema with context
  options: ['object', 'undefined']
};

/**
 * Create the SDL loader with hooks for validation, context injection, logging, and error handling.
 * Supports modules that export a factory function or a plain object/array, and a single or multiple SDL objects.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createSdlLoader = (options = {}) => {
  const loader = createLoader('sdl', {
    ...options,
    patterns: SDL_PATTERNS,
    validate: (module, context) => {
      // If factory, call with context/services; else use as-is
      const sdlObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const sdlList = Array.isArray(sdlObjs) ? sdlObjs : [sdlObjs];
      // Validate all SDL objects in the array
      return sdlList.every(sdlObj => validationHook(sdlObj, sdlSchema));
    },
    transform: (module, context) => {
      // If factory, call with context/services; else use as-is
      const sdlObjs = typeof module.default === 'function'
        ? module.default({ services: context?.services, config: context?.config })
        : module.default;
      const sdlList = Array.isArray(sdlObjs) ? sdlObjs : [sdlObjs];
      // Inject context/services if needed
      return sdlList.map(sdlObj => {
        const injected = contextInjectionHook(sdlObj, { services: context?.services, config: context?.config });
        return {
          ...injected,
          type: 'sdl',
          timestamp: Date.now()
        };
      });
    }
  });

  // Composable loader function
  return async (context) => {
    // Log the loading phase
    loggingHook(context, 'Loading SDL modules');

    // Wrap the loader in error handling
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(context);
      return { context: loaderContext, cleanup };
    }, context);
  };
}; 