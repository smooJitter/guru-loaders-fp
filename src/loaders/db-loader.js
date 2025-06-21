import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { buildFlatRegistryByName } from '../core/loader-core/lib/registry-builders.js';

// File patterns for database configs
export const DB_PATTERNS = [
  '**/*.db.js',
  '**/db/**/*.index.js'
];

// Minimal import logic: calls factory with context, flattens arrays, adds type/timestamp
export const importAndApplyAllDb = async (files, context) => {
  const modules = [];
  for (const file of files) {
    let mod = (await import(file)).default ?? (await import(file));
    let dbs = typeof mod === 'function' ? await mod(context) : mod;
    if (!Array.isArray(dbs)) dbs = [dbs];
    for (const db of dbs) {
      if (db && typeof db === 'object') {
        modules.push({ ...db, type: 'db', timestamp: Date.now() });
      }
    }
  }
  return modules;
};

// Context-agnostic validate: only checks for required fields
export const validateDbModule = (mod) => {
  return !!mod && typeof mod.name === 'string' && typeof mod.connection === 'object';
};

/**
 * Create a robust, extensible db loader.
 * @param {object} options - Loader options (patterns, logger, etc.)
 * @returns {function} Loader function
 */
export const createDbLoader = (options = {}) =>
  createAsyncLoader('dbs', {
    patterns: options.patterns || DB_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll || importAndApplyAllDb,
    validate: options.validate || validateDbModule,
    registryBuilder: buildFlatRegistryByName,
    contextKey: 'dbs',
    ...options
  });

export const dbLoader = createDbLoader();
export default dbLoader; 