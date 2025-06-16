import { curry, reduce, assoc, mergeRight } from 'ramda';
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../hooks/index.js';
import { findFiles as defaultFindFiles, importAndApply as defaultImportModule } from '../utils/file-utils.js';
import { getLoaderLogger } from '../utils/loader-logger.js';

// File patterns for environment modules
const ENV_PATTERNS = {
  default: '**/*.env.js',
  index: '**/env/**/*.index.js'
};

// Environment validation schema
const envSchema = {
  name: 'string',
  value: ['string', 'number', 'boolean', 'object', 'undefined'],
  options: ['object', 'undefined']
};

// Extract an environment object from a module (factory or object)
const extractEnv = (module, context) => {
  if (!module || typeof module !== 'object') return undefined;
  const mod = module.default || module;
  if (typeof mod === 'function') {
    return mod(context);
  }
  return mod;
};

// Function to flatten nested objects
const flattenObject = (obj, parentKey = '', separator = '_') =>
  Object.keys(obj).reduce((acc, key) => {
    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], newKey, separator));
    } else {
      acc[newKey] = obj[key];
    }
    return acc;
  }, {});

// Function to find and import modules
const findAndImportModules = curry(async (patterns, findFiles, importModule, ctx) => {
  const files = findFiles(patterns.default);
  try {
    return await Promise.all(files.map(file => importModule(file, ctx)));
  } catch (err) {
    getLoaderLogger(ctx, {}, 'env-loader').warn(`[env-loader] Error importing env files: ${err.message}`);
    return [];
  }
});

// Function to process a single module
const processModule = curry((ctx, logger, module) => {
  try {
    const envObj = extractEnv(module, ctx);
    if (!envObj) throw new Error('Module did not export a valid object or factory');
    validationHook(envObj, envSchema);
    const injected = contextInjectionHook(envObj, { services: ctx?.services });
    const finalObj = {
      ...injected,
      type: 'env',
      timestamp: Date.now()
    };
    if (!finalObj.name) throw new Error('Missing name property');
    return finalObj;
  } catch (err) {
    logger.warn(`Invalid or missing env in module: ${err.message}`);
    return null;
  }
});

// Function to build the registry
const buildRegistry = curry((ctx, modules) => {
  const logger = getLoaderLogger(ctx, {}, 'env-loader');
  const registry = reduce((acc, module) => {
    const envObj = processModule(ctx, logger, module);
    if (envObj) {
      if (acc[envObj.name]) {
        logger.warn('Duplicate env names found:', [envObj.name]);
      }
      return assoc(envObj.name, envObj, acc);
    }
    return acc;
  }, {}, modules);
  return registry;
});

// Modular envLoader function
export const envLoader = async (ctx) => {
  const options = ctx.options || {};
  const patterns = options.patterns || ENV_PATTERNS;
  const findFiles = options.findFiles || defaultFindFiles;
  const importModule = options.importModule || defaultImportModule;

  return errorHandlingHook(async () => {
    loggingHook(ctx, 'Loading environment modules');
    const modules = await findAndImportModules(patterns, findFiles, importModule, ctx);
    const registry = buildRegistry(ctx, modules);
    const flattenedEnvs = flattenObject(registry);
    return mergeRight(ctx, flattenedEnvs);
  }, ctx);
};