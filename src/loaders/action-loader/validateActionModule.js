// Validation utility for action-loader modules
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