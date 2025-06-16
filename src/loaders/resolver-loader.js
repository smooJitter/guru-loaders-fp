import { createLoader } from '../utils/loader-utils.js';
import { assoc, reduce } from 'ramda';

const RESOLVER_PATTERNS = [
  '**/*.resolver.js',
  '**/resolvers/**/*.index.js'
];

/**
 * Validate a resolver module
 * @param {string} type - The loader type ("resolvers")
 * @param {object} mod - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
export const validateResolverModule = (type, mod) => {
  let resolversArr;
  if (typeof mod.default === 'function') {
    resolversArr = mod.default({});
  } else if (Array.isArray(mod.default)) {
    resolversArr = mod.default;
  } else if (mod.default && typeof mod.default === 'object') {
    resolversArr = Object.entries(mod.default).flatMap(([ns, resolvers]) =>
      Object.entries(resolvers).map(([name, methodOrObj]) => {
        if (typeof methodOrObj === 'function') {
          return { namespace: ns, name, method: methodOrObj };
        }
        const { method, ...rest } = methodOrObj;
        return { namespace: ns, name, method, ...rest };
      })
    );
  } else {
    return false;
  }
  return Array.isArray(resolversArr) && resolversArr.every(
    (resolver) =>
      resolver &&
      typeof resolver.namespace === 'string' &&
      typeof resolver.name === 'string' &&
      typeof resolver.method === 'function'
  );
};

/**
 * Transform and flatten resolver modules into a namespaced registry (pure, immutable)
 * @param {object} module - The imported module
 * @param {object} context - The loader context
 * @returns {object} The resolvers registry
 */
export const extractResolvers = (module, context) => {
  let resolversArr;
  if (typeof module.default === 'function') {
    resolversArr = module.default(context);
  } else if (Array.isArray(module.default)) {
    resolversArr = module.default;
  } else if (module.default && typeof module.default === 'object') {
    resolversArr = Object.entries(module.default).flatMap(([ns, resolvers]) =>
      Object.entries(resolvers).map(([name, methodOrObj]) => {
        if (typeof methodOrObj === 'function') {
          return { namespace: ns, name, method: methodOrObj };
        }
        const { method, ...rest } = methodOrObj;
        return { namespace: ns, name, method, ...rest };
      })
    );
  } else {
    return {};
  }

  // Use Ramda's reduce/assoc for immutability
  return reduce((registry, resolver) => {
    if (!resolver.namespace || !resolver.name || typeof resolver.method !== 'function') {
      return registry;
    }
    const nsRegistry = registry[resolver.namespace] || {};
    // Wrap to inject context/resolvers at call time
    const wrapped = (args) =>
      resolver.method({ ...args, context, resolvers: registry });
    if (resolver.meta || resolver.options) {
      wrapped.meta = resolver.meta;
      wrapped.options = resolver.options;
    }
    return assoc(
      resolver.namespace,
      assoc(resolver.name, wrapped, nsRegistry),
      registry
    );
  }, {}, resolversArr);
};

export const createResolverLoader = (options = {}) =>
  createLoader('resolvers', {
    patterns: options.patterns || RESOLVER_PATTERNS,
    ...options,
    transform: extractResolvers,
    validate: validateResolverModule
  });

export default createResolverLoader(); 