import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { buildJsonRegistryWithWarning } from '../core/loader-core/lib/registry-builders.js';
import * as R from 'ramda';

const JSON_PATTERNS = [
  '**/*.json.js',
  '**/json/**/*.index.js'
];

// Import and apply: handles factory/object, augments with type/timestamp
export const importAndApplyAllJsons = async (files, context) => {
  const modules = await Promise.all(
    (files || []).map(async (file) => {
      let mod = (await import(file)).default ?? (await import(file));
      let jsonObj = typeof mod === 'function' ? await mod(context) : mod;
      if (jsonObj && typeof jsonObj === 'object') {
        return { ...jsonObj, type: 'json', timestamp: Date.now() };
      }
      return null;
    })
  );
  // Filter out nulls
  return modules.filter(Boolean);
};

// Context-agnostic validation: only allow { name: string, object }
export const validateJsonModule = (mod) => {
  return !!mod && typeof mod.name === 'string' && typeof mod === 'object';
};

export const createJsonLoader = (options = {}) =>
  createAsyncLoader('jsons', {
    patterns: options.patterns || JSON_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll || importAndApplyAllJsons,
    validate: options.validate || validateJsonModule,
    registryBuilder: options.registryBuilder || buildJsonRegistryWithWarning,
    contextKey: 'jsons',
    ...options
  });

export const jsonLoader = createJsonLoader();
export default jsonLoader; 