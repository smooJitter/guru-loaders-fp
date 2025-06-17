/**
 * Validate a resolver module
 * @param {string} type - The loader type ("resolvers")
 * @param {object} mod - The imported module
 * @param {object} ctx - The loader context
 * @returns {boolean} True if valid, false otherwise
 */
export const validateResolverModule = (type, mod, ctx = {}) => {
  const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
  let resolversArr;
  if (typeof mod.default === 'function') {
    resolversArr = mod.default(ctx);
  } else if (Array.isArray(mod.default)) {
    resolversArr = mod.default;
  } else if (mod.default && typeof mod.default === 'object') {
    resolversArr = Object.entries(mod.default).flatMap(([ns, resolvers]) =>
      Object.entries(resolvers).map(([name, methodOrObj]) => {
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
  const allValid = Array.isArray(resolversArr) && resolversArr.every(
    (resolver) =>
      resolver &&
      typeof resolver.namespace === 'string' &&
      typeof resolver.name === 'string' &&
      typeof resolver.method === 'function'
  );
  if (!allValid) {
    logger.warn?.('[resolvers-loader] Dropped invalid resolver object during validation.', resolversArr);
  }
  return allValid;
}; 