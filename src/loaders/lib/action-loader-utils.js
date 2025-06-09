// Utility functions for action-loader legacy and future use

/**
 * Collect all action functions from a module, supporting default export (function/object/factory) and named exports.
 * Warn if both default and named exports are present.
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object} Map of action functions
 */
export const getActionsFromModule = (module, ctx) => {
  if (!module || typeof module !== 'object') {
    const logger = ctx?.services?.logger;
    logger?.debug?.('[extractor] skipping non-object module:', module);
    return {};
  }
  const logger = ctx?.services?.logger;
  let actions = {};
  let hasDefault = false;
  let hasNamed = false;

  // Merge from default export if present
  if (module.default && typeof module.default === 'object') {
    hasDefault = true;
    for (const [key, fn] of Object.entries(module.default)) {
      if (typeof fn === 'function') actions[key] = fn;
    }
  }
  // Merge from 'actions' named export if present
  if (module.actions && typeof module.actions === 'object') {
    hasNamed = true;
    for (const [key, fn] of Object.entries(module.actions)) {
      if (typeof fn === 'function') actions[key] = fn;
    }
  }
  // Merge from other named exports (excluding default/actions)
  for (const [key, fn] of Object.entries(module)) {
    if (key !== 'default' && key !== 'actions' && typeof fn === 'function') {
      hasNamed = true;
      actions[key] = fn;
    }
  }
  // Warn if both default and actions are present
  if (hasDefault && hasNamed) {
    logger?.warn?.('[action-loader] Both default and named action exports found.');
  }
  if (logger?.debug) {
    logger.debug('[DEBUG getActionsFromModule] module:', module, 'actions:', actions);
  } else if (process.env.NODE_ENV !== 'production') {
    // Only log in non-production if no logger
    // console.log('[DEBUG getActionsFromModule] module:', module, 'actions:', actions);
  }
  return actions;
};

/**
 * Validate that the module exports at least one function (default or named).
 * Optionally validate meta/options shape.
 * @param {object} module - The imported module
 * @param {object} context - The loader context
 * @returns {boolean}
 */
export const validateActionModule = (type, mod) => {
  let actionsArr;
  if (typeof mod.default === 'function') {
    actionsArr = mod.default({}); // Validate shape, not logic
  } else if (Array.isArray(mod.default)) {
    actionsArr = mod.default;
  } else if (mod.default && typeof mod.default === 'object') {
    actionsArr = Object.entries(mod.default).flatMap(([ns, actions]) =>
      Object.entries(actions).map(([name, methodOrObj]) => {
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
  return actionsArr.every(
    (action) =>
      action &&
      typeof action.namespace === 'string' &&
      typeof action.name === 'string' &&
      typeof action.method === 'function'
  );
}; 