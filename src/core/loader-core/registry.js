/**
 * Registry strategies and utilities for loader-utils-new.
 * Includes registryStrategies, buildRegistry, and helpers for module validation and logging.
 */
import { filter, map, reduce, mergeWith, append, mergeDeepWith, flatten } from 'ramda';

// Validate input
export const isValidInput = (modules) =>
  modules && (typeof modules === 'object' || Array.isArray(modules));

// Convert to module list
export const toModuleList = (modules) =>
  Array.isArray(modules)
    ? modules
    : filter(m => m && typeof m === 'object', Object.values(modules));

// Validate module
export const isValidModule = (module) => {
  const hasName = module?.name && typeof module.name === 'string';
  const hasService = module?.service || typeof module === 'function';
  return hasName && hasService;
};

// Get logger
export const getLogger = (context) =>
  (context?.logger || context?.services?.logger || console);

// Registry building strategies
export const registryStrategies = {
  flat: (name, mod) => ({ [name]: mod.service || mod }),
  namespaced: (name, mod) => ({
    [mod.namespace || name]: { [name]: mod.service || mod }
  }),
  service: (name, mod) => ({ [name]: mod.service || mod }),

  // 1. Hierarchical: dot-separated names become nested objects
  hierarchical: (name, mod) => {
    const parts = name.split('.');
    return parts.reduceRight((acc, part, idx) => (
      idx === parts.length - 1
        ? { [part]: mod.service || mod }
        : { [part]: acc }
    ), {});
  },

  // 2. Versioned: group by name, then by version
  versioned: (name, mod) => {
    const version = mod.version || 'v1';
    return {
      [name]: {
        [version]: mod.service || mod
      }
    };
  },

  // 3. Tagged: group modules by each tag in mod.tags (array)
  tagged: (name, mod) => {
    if (!Array.isArray(mod.tags)) return {};
    return mod.tags.reduce((acc, tag) => {
      acc[tag] = acc[tag] || [];
      acc[tag].push(mod.service || mod);
      return acc;
    }, {});
  },

  // 4. Event: group handlers by event name (append to array)
  event: (name, mod) => ({
    [name]: [mod.handler || mod.service || mod]
  }),

  // 5. Composite: merge properties/methods for same name (deep merge)
  composite: (name, mod) => ({
    [name]: mod.service || mod
  }),

  // 6. Pipeline: register as array of steps for each name
  pipeline: (name, mod) => ({
    [name]: [mod.service || mod]
  })
};

/**
 * Flexible, extensible registry builder.
 * Supports custom strategies, custom validation, transform pipelines, and strict error handling.
 * Now supports event, composite, and pipeline strategies with correct merging.
 */
export const buildRegistry = (modules, context, options = {}) => {
  const {
    type = 'flat',
    transformFn = (m) => m,
    logger = getLogger(context),
    customStrategies = {},
    validateModule = isValidModule,
    transforms = [],
    strict = false,
    onError = null
  } = options;
  const strategies = { ...registryStrategies, ...customStrategies };
  let buildStrategy = strategies[type];
  if (!buildStrategy) {
    logger?.warn?.(`[buildRegistry] Unknown registry type '${type}', falling back to 'flat'.`, { type, context });
    buildStrategy = strategies.flat;
  }
  const transformPipeline = Array.isArray(transforms) && transforms.length
    ? (mod, ctx) => {
        try {
          return transforms.reduce((acc, fn) => fn(acc, ctx), mod);
        } catch (err) {
          logger?.error?.(`[buildRegistry] Transform pipeline error for module '${mod?.name}': ${err.message}`, { mod, error: err, context });
          if (onError) onError(err, { mod, context, phase: 'transform' });
          return null;
        }
      }
    : (mod, ctx) => {
        try {
          return transformFn(mod, ctx);
        } catch (err) {
          logger?.error?.(`[buildRegistry] TransformFn error for module '${mod?.name}': ${err.message}`, { mod, error: err, context });
          if (onError) onError(err, { mod, context, phase: 'transformFn' });
          return null;
        }
      };

  if (!isValidInput(modules)) {
    logger?.debug?.('[buildRegistry] Invalid input, returning empty registry:', modules);
    if (strict) throw new Error('Invalid modules input');
    return {};
  }

  let result = (
    toModuleList(modules)
      .filter(validateModule)
      .map(mod => transformPipeline(mod, context))
      .filter(Boolean)
      .reduce((registry, mod) => {
        try {
          const entry = buildStrategy(mod.name, mod);
          if (["event", "pipeline"].includes(type)) {
            // Merge arrays for event/pipeline (preserve input order)
            return mergeWith(append, entry, registry);
          }
          if (type === "composite") {
            // Deep merge for composite
            return mergeDeepWith(
              (x, y) => (Array.isArray(x) && Array.isArray(y) ? x.concat(y) : y),
              registry,
              entry
            );
          }
          // Default: shallow merge (overwrite)
          return { ...registry, ...entry };
        } catch (err) {
          logger?.error?.(`[buildRegistry] Reducer error for module '${mod?.name}': ${err.message}`, { mod, error: err, context });
          if (onError) onError(err, { mod, context, phase: 'reducer' });
          return registry;
        }
      }, {})
  );
  if (["event", "pipeline"].includes(type)) {
    result = map(flatten, result);
  }
  return result;
}; 