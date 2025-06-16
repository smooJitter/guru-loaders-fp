import { createLoader } from '../utils/loader-utils.js';

const SDL_PATTERNS = [
  '**/*.sdl.js',
  '**/sdl/**/*.index.js'
];

/**
 * Extract and transform SDL module(s)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object[]} Array of SDL objects
 */
export const extractSdl = (module, ctx) => {
  if (!module || typeof module !== 'object') return [];
  const mod = module.default || module;
  const sdls = typeof mod === 'function' ? mod(ctx) : mod;
  const sdlList = Array.isArray(sdls) ? sdls : [sdls];
  return sdlList
    .filter(Boolean)
    .map(obj => ({
      ...obj,
      type: 'sdl',
      timestamp: Date.now()
    }));
};

/**
 * Validate an SDL module
 * @param {string} type - The loader type ("sdls")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateSdlModule = (type, module) => {
  const mod = module.default || module;
  const sdls = typeof mod === 'function' ? mod({}) : mod;
  const sdlList = Array.isArray(sdls) ? sdls : [sdls];
  return sdlList.every(obj =>
    obj &&
    typeof obj.name === 'string' &&
    typeof obj.schema === 'string'
  );
};

export const createSdlLoader = (options = {}) =>
  createLoader('sdls', {
    patterns: options.patterns || SDL_PATTERNS,
    ...options,
    transform: (module, ctx) => {
      const sdls = extractSdl(module, ctx);
      return sdls.reduce((acc, obj) => {
        if (obj && obj.name) acc[obj.name] = obj;
        return acc;
      }, {});
    },
    validate: validateSdlModule
  });

export default createSdlLoader(); 