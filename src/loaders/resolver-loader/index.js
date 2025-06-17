import { createLoader } from '../../utils/loader-utils.js';
import { assoc, reduce } from 'ramda';
import { validateResolverModule } from './resolver-validators.js';
import { extractResolvers } from './resolver-transformers.js';

const RESOLVER_PATTERNS = [
  '**/*.resolver.js',
  '**/resolvers/**/*.index.js'
];

export const createResolverLoader = (options = {}) =>
  createLoader('resolvers', {
    patterns: options.patterns || RESOLVER_PATTERNS,
    ...options,
    transform: (modules, ctx) => {
      const logger = (ctx && (ctx.logger || (ctx.services && ctx.services.logger))) || console;
      const resolversArr = [];

      for (const module of modules) {
        const moduleResolvers = extractResolvers(module, ctx);
        resolversArr.push(...moduleResolvers);
      }

      // Build registry: { [namespace]: { [name]: wrappedFn } }
      const registry = {};
      resolversArr.forEach(resolver => {
        if (!resolver || !resolver.namespace || !resolver.name || typeof resolver.method !== 'function') {
          logger.warn?.('[resolvers-loader] Dropped invalid resolver object during registry build.', resolver);
          return;
        }
        if (!registry[resolver.namespace]) {
          registry[resolver.namespace] = {};
        }
        if (registry[resolver.namespace][resolver.name]) {
          logger.warn?.(`[resolvers-loader] Duplicate resolver detected: ${resolver.namespace}.${resolver.name}`);
        }
        // Wrap to inject context/resolvers at call time
        const wrapped = (args) => resolver.method({ ...args, context: ctx, resolvers: registry });
        if (resolver.meta || resolver.options) {
          wrapped.meta = resolver.meta;
          wrapped.options = resolver.options;
        }
        registry[resolver.namespace][resolver.name] = wrapped;
      });
      return registry;
    },
    validate: (type, mod, ctx) => validateResolverModule(type, mod, ctx)
  });

export const resolverLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createResolverLoader({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  const { context } = await loader(ctx);
  return { resolvers: context.resolvers || {} };
};
export default resolverLoader; 