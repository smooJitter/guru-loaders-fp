/**
 * Transform and flatten resolver modules into a namespaced registry (pure, immutable)
 * @param {object} module - The imported module
 * @param {object} context - The loader context
 * @returns {object[]} Array of resolver objects { namespace, name, method }
 */
export const extractResolvers = (module, context) => {
  const logger = (context && (context.logger || (context.services && context.services.logger))) || console;
  let resolversArr;
  if (typeof module.default === 'function') {
    resolversArr = module.default(context);
  } else if (Array.isArray(module.default)) {
    resolversArr = module.default;
  } else if (module.default && typeof module.default === 'object') {
    resolversArr = Object.entries(module.default).flatMap(([ns, resolvers]) =>
      Object.entries(resolvers).map(([name, methodOrObj]) => {
        if (typeof methodOrObj === 'function') {
          return { namespace: ns, name, method: methodOrObj };
        }
        const { method, ...rest } = methodOrObj;
        return { namespace: ns, name, method, ...rest };
      })
    );
  } else {
    return [];
  }
  return resolversArr
    .map(resolver => {
      if (!resolver.namespace || !resolver.name) {
        logger.warn?.('[resolvers-loader] Dropped invalid resolver object during transform (missing namespace or name).', resolver);
        return null;
      }
      if (typeof resolver.method !== 'function') {
        logger.warn?.('[resolvers-loader] Resolver object has invalid method (not a function).', resolver);
      }
      return resolver;
    })
    .filter(Boolean);
}; 