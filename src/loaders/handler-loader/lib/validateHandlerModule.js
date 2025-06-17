/**
 * Validate a handler module for handler-loader
 * @param {string} type - The loader type ("handlers")
 * @param {object} mod - The imported module
 * @param {object} ctx - The loader context (for logging)
 * @returns {boolean} True if valid, false otherwise
 */
export const validateHandlerModule = (type, mod, ctx = {}) => {
  const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
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
    logger.warn?.('[handler-loader] Dropped invalid handler module during validation.', mod);
    return false;
  }
  const allValid = Array.isArray(handlersArr) && handlersArr.every(
    (handler) =>
      handler &&
      typeof handler.namespace === 'string' &&
      typeof handler.name === 'string' &&
      typeof handler.method === 'function'
  );
  if (!allValid) {
    logger.warn?.('[handler-loader] Dropped invalid handler(s) during validation.', handlersArr);
  }
  return allValid;
}; 