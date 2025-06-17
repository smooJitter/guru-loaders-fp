import { findFiles, importAndApply } from '../utils/file-utils.js';

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
    typeof obj.sdl === 'string'
  );
};

export const createSdlLoader = (options = {}) => {
  const patterns = options.patterns || SDL_PATTERNS;
  const findFilesFn = options.findFiles || findFiles;
  const importModuleFn = options.importModule || importAndApply;

  return async (ctx) => {
    const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
    const files = await findFilesFn(patterns);
    const sdls = {};

    for (const file of files) {
      try {
        const module = await importModuleFn(file, ctx);
        const sdlList = extractSdl(module, ctx);
        for (const obj of sdlList) {
          if (!obj || typeof obj.name !== 'string') {
            logger.warn?.('[sdl-loader] Dropped invalid SDL object during transform (missing name).', obj);
            continue;
          }
          if (typeof obj.sdl !== 'string') {
            logger.warn?.('[sdl-loader] SDL object has invalid schema (not a string).', obj);
            continue;
          }
          if (sdls[obj.name]) {
            logger.warn?.(`[sdl-loader] Duplicate SDL name: ${obj.name}`);
          }
          sdls[obj.name] = obj;
        }
      } catch (error) {
        logger.warn?.(`[sdl-loader] Failed to load SDL module: ${file}`, error);
      }
    }

    return { context: { ...ctx, sdls } };
  };
};

export const sdlLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createSdlLoader({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  const { context } = await loader(ctx);
  return { sdls: context.sdls || {} };
};

export default sdlLoader; 