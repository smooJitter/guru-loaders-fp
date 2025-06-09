// Utility to flatten and aggregate handlers from modules for handler-loader
export const extractHandlers = (modules, context) => {
  const registry = {};
  for (const mod of modules) {
    let handlersArr;
    if (typeof mod.default === 'function') {
      // Factory export
      handlersArr = mod.default(context);
    } else if (Array.isArray(mod.default)) {
      handlersArr = mod.default;
    } else if (mod.default && typeof mod.default === 'object') {
      // Support legacy object-by-namespace (convert to array)
      handlersArr = Object.entries(mod.default).flatMap(([ns, handlers]) =>
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
    for (const handler of handlersArr) {
      if (!handler.namespace || !handler.name || typeof handler.method !== 'function') continue;
      if (!registry[handler.namespace]) registry[handler.namespace] = {};
      if (registry[handler.namespace][handler.name]) {
        context?.services?.logger?.warn?.(`[handler-loader] Duplicate handler: ${handler.namespace}.${handler.name}`);
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