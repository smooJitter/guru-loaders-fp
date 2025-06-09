/**
 * Lifecycle Hook
 *
 * @function lifecycleHook
 * @description Runs an array of lifecycle methods (functions) with the provided context. Intended for use in loader pipelines or modular steps.
 * @param {function[]} lifecycleMethods - Array of functions to run.
 * @param {object} context - The loader or app context.
 * @returns {Promise<object>} The context after running all lifecycle methods.
 */
export const lifecycleHook = async (lifecycleMethods, context) => {
  for (const method of lifecycleMethods) {
    if (typeof method === 'function') {
      await method(context);
    }
  }
  return context;
};

/**
 * Runs lifecycle hooks by event name if present on context.
 * @param {string} event - The lifecycle event name (e.g., 'beforeAll', 'onError').
 * @param {object} context - The loader or app context.
 * @returns {Promise<void>} Resolves when all hooks for the event have run.
 */
export const runLifecycle = async (event, context) => {
  if (context && typeof context[`on${capitalize(event)}`] === 'function') {
    await context[`on${capitalize(event)}`](context);
  } else if (context && Array.isArray(context[`on${capitalize(event)}`])) {
    for (const fn of context[`on${capitalize(event)}`]) {
      if (typeof fn === 'function') {
        await fn(context);
      }
    }
  }
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 