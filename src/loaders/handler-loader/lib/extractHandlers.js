/**
 * Extract and flatten handlers from modules for handler-loader
 * @param {object[]} modules - Array of imported handler modules
 * @param {object} context - The loader context (for logging)
 * @returns {object} The handlers registry { [namespace]: { [name]: fn } }
 */
export const extractHandlers = (modules, context) => {
  if (!Array.isArray(modules)) modules = [modules];
  const logger = (context && (context.logger || (context.services && context.services.logger))) || console;
  const registry = {};
  for (const mod of modules) {
    let handlersArr;
    if (typeof mod.default === 'function') {
      const result = mod.default(context);
      if (!result || (typeof result !== 'object' && !Array.isArray(result))) {
        continue;
      }
      if (Array.isArray(result)) {
        handlersArr = result;
      } else if (result && typeof result === 'object') {
        // Flatten namespaced object: { ns: { handlerName: fn|obj } }
        handlersArr = Object.entries(result).flatMap(([ns, handlers]) =>
          Object.entries(handlers).map(([name, methodOrObj]) => {
            if (typeof methodOrObj === 'function') {
              return { namespace: ns, name, method: methodOrObj };
            }
            const { method, ...rest } = methodOrObj;
            return { namespace: ns, name, method, ...rest };
          })
        );
      } else {
        continue;
      }
    } else if (Array.isArray(mod.default)) {
      handlersArr = mod.default;
    } else if (mod.default && typeof mod.default === 'object') {
      handlersArr = Object.entries(mod.default).flatMap(([ns, handlers]) =>
        Object.entries(handlers).map(([name, methodOrObj]) => {
          if (typeof methodOrObj === 'function') {
            return { namespace: ns, name, method: methodOrObj };
          }
          // Support { method } or { method, meta, options }
          if (methodOrObj && typeof methodOrObj === 'object' && typeof methodOrObj.method === 'function') {
            const { method, meta, options } = methodOrObj;
            return { namespace: ns, name, method, meta, options };
          }
          return null;
        }).filter(Boolean)
      );
    } else {
      continue;
    }
    for (const handler of handlersArr) {
      if (!handler.namespace || !handler.name || typeof handler.method !== 'function') {
        logger.warn?.('[handler-loader] Dropped invalid handler object during extraction.', handler);
        continue;
      }
      if (!registry[handler.namespace]) registry[handler.namespace] = {};
      if (registry[handler.namespace][handler.name]) {
        logger.warn?.(`[handler-loader] Duplicate handler: ${handler.namespace}.${handler.name}`);
        continue;
      }
      // Wrap to inject context/handlers at call time
      registry[handler.namespace][handler.name] = (args) =>
        handler.method({ ...args, context, handlers: registry });
      // Optionally attach meta/options for introspection
      if (handler.meta || handler.options) {
        registry[handler.namespace][handler.name].meta = handler.meta;
        registry[handler.namespace][handler.name].options = handler.options;
      }
    }
  }
  return registry;
}; 