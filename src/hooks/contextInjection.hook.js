/**
 * Context Injection Hook
 *
 * @function contextInjectionHook
 * @description Injects the loader or app context into a module. Intended for use in loader pipelines or modular steps.
 * @param {object} module - The module to inject context into.
 * @param {object} context - The context to inject.
 * @returns {object} The module with context attached.
 */
export const contextInjectionHook = (module, context) => {
  return {
    ...module,
    context,
  };
}; 