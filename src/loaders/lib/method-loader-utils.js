// Utility functions for method-loader legacy and future use

/**
 * Collect all method functions from a module, supporting default export (function/object/factory) and named exports.
 * Warn if both default and named exports are present.
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object} Map of method functions
 */
export const getMethodsFromModule = (module, ctx) => {
  if (!module || typeof module !== 'object') {
    const logger = ctx?.services?.logger;
    logger?.debug?.('[extractor] skipping non-object module:', module);
    return {};
  }
  const logger = ctx?.services?.logger;
  let methods = {};
  let hasDefault = false;
  let hasNamed = false;

  // Support default export as a function
  if (module.default) {
    if (typeof module.default === 'function') {
      hasDefault = true;
      methods[module.default.name || 'default'] = module.default;
    } else if (typeof module.default === 'object') {
      hasDefault = true;
      for (const [key, fn] of Object.entries(module.default)) {
        if (typeof fn === 'function') methods[key] = fn;
      }
    }
  }
  // Merge from 'methods' named export if present
  if (module.methods && typeof module.methods === 'object') {
    hasNamed = true;
    for (const [key, fn] of Object.entries(module.methods)) {
      if (typeof fn === 'function') methods[key] = fn;
    }
  }
  // Merge from other named exports (excluding default/methods)
  for (const [key, fn] of Object.entries(module)) {
    if (key !== 'default' && key !== 'methods' && typeof fn === 'function') {
      hasNamed = true;
      methods[key] = fn;
    }
  }
  // Warn if both default and methods are present
  if (hasDefault && hasNamed) {
    logger?.warn?.('[method-loader] Both default and named method exports found.');
  }
  if (logger?.debug) {
    logger.debug('[DEBUG getMethodsFromModule] module:', module, 'methods:', methods);
  } else if (process.env.NODE_ENV !== 'production') {
    // Only log in non-production if no logger
    // console.log('[DEBUG getMethodsFromModule] module:', module, 'methods:', methods);
  }
  return methods;
};

/**
 * Validate that the module exports at least one function (default or named).
 * Optionally validate meta/options shape.
 * @param {object} module - The imported module
 * @param {object} context - The loader context
 * @returns {boolean}
 */
export const validateMethodModule = (module, context) => {
  const methodFns = getMethodsFromModule(module, context);
  const fnCount = Object.values(methodFns).filter(fn => typeof fn === 'function').length;
  if (fnCount === 0) {
    const logger = context?.services?.logger;
    logger?.error?.('[method-loader] No valid method functions found in module:', module.meta || module.options || '[module info omitted]');
    return false;
  }
  // Optionally: validate meta/options shape (not enforced strictly)
  if (module.meta && typeof module.meta !== 'object') {
    context?.services?.logger?.warn?.('[method-loader] meta should be an object:', module.meta);
  }
  if (module.options && typeof module.options !== 'object') {
    context?.services?.logger?.warn?.('[method-loader] options should be an object:', module.options);
  }
  return true;
}; 