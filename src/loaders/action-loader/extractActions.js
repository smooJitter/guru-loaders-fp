// Utility to flatten and aggregate actions from modules for action-loader
export const extractActions = (modules, context) => {
  const registry = {};
  for (const mod of modules) {
    let actionsArr;
    if (typeof mod.default === 'function') {
      // Factory export
      actionsArr = mod.default(context);
    } else if (Array.isArray(mod.default)) {
      actionsArr = mod.default;
    } else if (mod.default && typeof mod.default === 'object') {
      // Support legacy object-by-namespace (convert to array)
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
      continue;
    }
    for (const action of actionsArr) {
      if (!action.namespace || !action.name || typeof action.method !== 'function') continue;
      if (!registry[action.namespace]) registry[action.namespace] = {};
      if (registry[action.namespace][action.name]) {
        context?.services?.logger?.warn?.(`[action-loader] Duplicate action: ${action.namespace}.${action.name}`);
      }
      // Wrap to inject context/actions at call time
      registry[action.namespace][action.name] = (args) =>
        action.method({ ...args, context, actions: registry });
      // Optionally attach meta/options for introspection
      if (action.meta || action.options) {
        registry[action.namespace][action.name].meta = action.meta;
        registry[action.namespace][action.name].options = action.options;
      }
    }
  }
  return registry;
}; 