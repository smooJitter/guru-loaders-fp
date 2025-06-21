// registry-builders.js — loader-core
// All pure registry builder functions live here
import * as R from 'ramda';

/**
 * Flat by name: { name: ... } => { name: obj }
 */
export const buildFlatRegistryByName = modules =>
  R.indexBy(R.prop('name'), (modules || []).filter(m => m && typeof m.name === 'string'));

/**
 * Flat by modelName: { modelName: ... } => { modelName: obj }
 */
export const buildFlatRegistryByModelName = modules =>
  R.indexBy(R.prop('modelName'), (modules || []).filter(m => m && typeof m.modelName === 'string'));

/**
 * Namespaced: { namespace, name, method } => { namespace: { name: method } }
 */
export const buildNamespacedRegistry = R.pipe(
  (modules = []) => modules.filter(m => m && typeof m.namespace === 'string' && typeof m.name === 'string'),
  R.groupBy(R.prop('namespace')),
  R.map(
    R.pipe(
      R.indexBy(R.prop('name')),
      R.map(m => typeof m.method === 'function' ? m.method : undefined)
    )
  )
);

/**
 * Hierarchical: dot-separated name (e.g., 'User.byId') => { User: { byId: value } }
 */
export const buildHierarchicalRegistry = (modules) =>
  (modules || [])
    .filter(m => m && typeof m.name === 'string')
    .map(({ name, value }) => R.assocPath(name.split('.'), value, {}))
    .reduce(R.mergeDeepRight, {});

/**
 * Event pipeline: { name, event } => { name: eventObj }
 * Warns on duplicate names using logger from context.
 */
export const buildEventPipelineRegistries = (modules = [], context) => {
  const logger = context?.services?.logger || context?.logger || console;
  // Only keep valid event objects
  const validEvents = R.filter(
    m => m && typeof m.name === 'string' && typeof m.event === 'function',
    modules
  );
  // Build flat registry, warn on duplicate
  return R.reduce((acc, mod) => {
    if (acc[mod.name]) {
      logger.warn?.(`[event-loader] Duplicate event name: ${mod.name}`);
    }
    acc[mod.name] = mod;
    return acc;
  }, {}, validEvents);
};

/**
 * Feature registries: Merge multiple feature manifests into unified registries.
 * @param {Array} featureManifests - Array of feature manifest objects, each with typeComposers, queries, mutations, resolvers
 * @returns {Object} { typeComposers, queries, mutations, resolvers }
 */
export const buildFeatureRegistries = (featureManifests) => {
  const safeManifests = (featureManifests || []).filter(m => m && typeof m === 'object');
  return {
    typeComposers: R.reduce(R.mergeDeepRight, {}, safeManifests.map(m => m.typeComposers || {})),
    queries: R.reduce(R.mergeDeepRight, {}, safeManifests.map(m => m.queries || {})),
    mutations: R.reduce(R.mergeDeepRight, {}, safeManifests.map(m => m.mutations || {})),
    resolvers: R.reduce(R.mergeDeepRight, {}, safeManifests.map(m => m.resolvers || {})),
  };
};

/**
 * JSON registry: { name, ... } => { name: jsonObj }
 * Warns on duplicate names using logger from context.
 */
export const buildJsonRegistryWithWarning = (modules = [], context) => {
  const logger = context?.services?.logger || context?.logger || console;
  // Only keep valid jsons
  const validJsons = R.filter(
    m => m && typeof m.name === 'string' && typeof m === 'object',
    modules
  );
  // Build registry, warn on duplicate
  return R.reduce((acc, mod) => {
    if (acc[mod.name]) {
      logger.warn?.(`[json-loader] Duplicate JSON name: ${mod.name}`);
    }
    acc[mod.name] = mod;
    return acc;
  }, {}, validJsons);
};

/**
 * Middleware registry: { name, middleware } => { name: middlewareObj }
 * Warns on duplicate names using logger from context.
 */
export const buildMiddlewareRegistryWithWarning = (modules = [], context) => {
  const logger = context?.services?.logger || context?.logger || console;
  // Only keep valid middleware objects
  const valid = R.filter(
    m => m && typeof m.name === 'string' && typeof m.middleware === 'function',
    modules
  );
  // Build registry, warn on duplicate
  return R.reduce((acc, mod) => {
    if (acc[mod.name]) {
      logger.warn?.(`[middleware-loader] Duplicate middleware name: ${mod.name}`);
    }
    acc[mod.name] = mod;
    return acc;
  }, {}, valid);
};

/**
 * Pubsub registry: { name, ... } => { name: pubsubObj }
 * Warns on duplicate names using logger from context.
 */
export const buildPubsubRegistryWithWarning = (modules = [], context) => {
  const logger = context?.services?.logger || context?.logger || console;
  // Only keep valid pubsub objects
  const valid = R.filter(
    m => m && typeof m.name === 'string' && typeof m === 'object',
    modules
  );
  // Build registry, warn on duplicate
  return R.reduce((acc, mod) => {
    if (acc[mod.name]) {
      logger.warn?.(`[pubsub-loader] Duplicate pubsub name: ${mod.name}`);
    }
    acc[mod.name] = mod;
    return acc;
  }, {}, valid);
};

/**
 * Route registry: { name, method, path, handler } => { name: routeObj }
 * Warns on duplicate names using logger from context.
 */
export const buildRouteRegistryWithWarning = (modules = [], context) => {
  const logger = context?.services?.logger || context?.logger || console;
  const valid = R.filter(
    m =>
      m &&
      typeof m.name === 'string' &&
      typeof m.method === 'string' &&
      typeof m.path === 'string' &&
      typeof m.handler === 'function',
    modules
  );
  return R.reduce((acc, mod) => {
    if (acc[mod.name]) {
      logger.warn?.(`[route-loader] Duplicate route name: ${mod.name}`);
    }
    acc[mod.name] = mod;
    return acc;
  }, {}, valid);
};

/**
 * SDL registry: { name, sdl } => { name: sdlObj }
 * Warns on duplicate names using logger from context.
 */
export const buildSdlRegistryWithWarning = (modules = [], context) => {
  const logger = safeLogger(context?.services?.logger || context?.logger || console);
  const valid = R.filter(
    m => m && typeof m.name === 'string' && typeof m.sdl === 'string',
    modules
  );
  return R.reduce((acc, mod) => {
    if (acc[mod.name]) {
      logger.warn(`[sdl-loader] Duplicate SDL name: ${mod.name}`);
    }
    acc[mod.name] = mod;
    return acc;
  }, {}, valid);
};

// Add safeLogger utility
function safeLogger(logger) {
  return {
    warn: (...args) => {
      try { logger?.warn?.(...args); } catch (e) { try { console.warn('[safeLogger fallback]', ...args); } catch {} }
    },
    error: (...args) => {
      try { logger?.error?.(...args); } catch (e) { try { console.error('[safeLogger fallback]', ...args); } catch {} }
    },
    info: (...args) => {
      try { logger?.info?.(...args); } catch (e) { try { console.info('[safeLogger fallback]', ...args); } catch {} }
    },
    debug: (...args) => {
      try { logger?.debug?.(...args); } catch (e) { try { console.debug('[safeLogger fallback]', ...args); } catch {} }
    },
  };
}
