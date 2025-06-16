// LEGACY: This loader only supports the { name, methods } pattern. Use handler-loader for modern namespaced/array/factory patterns.
// For new code, prefer handler-loader.
//

import { createLoader } from '../utils/loader-utils.js';
import { assoc, reduce } from 'ramda';

const METHOD_PATTERNS = [
  '**/*.methods.js',
  '**/methods/**/*.index.js'
];

/**
 * Extract and transform method module(s) (supports legacy, namespaced, array, and factory)
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object} Flat or namespaced registry of methods
 */
export const extractMethod = (module, ctx) => {
  if (!module || typeof module !== 'object') return {};
  const mod = module.default || module;

  // Legacy: { name, methods }
  if (typeof mod.name === 'string' && typeof mod.methods === 'object' && mod.methods !== null) {
    const validMethods = Object.entries(mod.methods).filter(([, fn]) => typeof fn === 'function');
    if (validMethods.length === 0) return {};
    return {
      [mod.name]: {
        method: (args) => validMethods[0][1]({ ...args, context: ctx, methods: { [mod.name]: mod.methods } }),
        type: 'methods',
        timestamp: Date.now()
      }
    };
  }

  // Array of method objects: [{ name, method }]
  if (Array.isArray(mod)) {
    return reduce((acc, item) => {
      if (item && typeof item.name === 'string' && typeof item.method === 'function') {
        return assoc(item.name, {
          method: (args) => item.method({ ...args, context: ctx, methods: acc }),
          type: 'methods',
          timestamp: Date.now()
        }, acc);
      }
      return acc;
    }, {}, mod);
  }

  // Namespaced: { user: { doThing: fn } }
  if (typeof mod === 'object') {
    return Object.entries(mod).reduce((acc, [ns, methods]) => {
      if (typeof methods === 'object') {
        Object.entries(methods).forEach(([name, fn]) => {
          if (typeof fn === 'function') {
            acc[`${ns}.${name}`] = {
              method: (args) => fn({ ...args, context: ctx, methods: acc }),
              type: 'methods',
              timestamp: Date.now()
            };
          }
        });
      }
      return acc;
    }, {});
  }

  // Factory: function returning any of the above
  if (typeof mod === 'function') {
    return extractMethod(mod(ctx), ctx);
  }

  return {};
};

/**
 * Validate a method module (modern and legacy)
 * @param {string} type - The loader type ("methods")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateMethodModule = (type, module) => {
  const registry = extractMethod(module, {});
  return Object.keys(registry).length > 0;
};

export const createMethodLoader = (options = {}) =>
  createLoader('methods', {
    patterns: options.patterns || METHOD_PATTERNS,
    ...options,
    transform: extractMethod,
    validate: validateMethodModule
  });

export default createMethodLoader(); 