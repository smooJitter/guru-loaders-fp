import { createLoader } from '../core/pipeline/create-pipeline.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for SDL files
const SDL_PATTERNS = {
  default: '**/*-sdl.js',
  index: '**/sdl/**/index.js'
};

// SDL validation schema for the validation hook
const sdlSchema = {
  name: 'string',
  schema: 'string',
  buildSchema: 'function', // Optional function to build schema with context
  options: 'object'
};

/**
 * Create the SDL loader with hooks for validation, context injection, logging, and error handling.
 * @param {object} options Loader options
 * @returns {function} Loader function
 */
export const createSdlLoader = (options = {}) => {
  const loader = createLoader('sdl', {
    ...options,
    patterns: SDL_PATTERNS,
    validate: (module) => validationHook(module, sdlSchema),
    transform: (module, context) => {
      // Inject context dependencies if needed (e.g., services)
      return contextInjectionHook(module, { services: context?.services });
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