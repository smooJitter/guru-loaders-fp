// Validation utility for handler-loader modules
export const validateHandlerModule = (type, mod) => {
  let handlersArr;
  if (typeof mod.default === 'function') {
    handlersArr = mod.default({}); // Validate shape, not logic
  } else if (Array.isArray(mod.default)) {
    handlersArr = mod.default;
  } else if (mod.default && typeof mod.default === 'object') {
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
    return false;
  }
  return handlersArr.every(
    (handler) =>
      handler &&
      typeof handler.namespace === 'string' &&
      typeof handler.name === 'string' &&
      typeof handler.method === 'function'
  );
}; 