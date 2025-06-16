import { pipeAsync } from './utils/async-pipeline-utils.js';
import {
  envLoader,
  dbLoader,
  serviceLoader,
  modelLoader,
  actionLoader,
  handlerLoader,
  methodLoader,
  eventLoader,
  dataLoader,
  jsonLoader,
  middlewareLoader,
  routeLoader,
  authLoader,
  pubsubLoader,
  sdlLoader,
  typeLoader,
  populateTypeComposers,
  typeComposerLoader2,
  featureLoader,
  resolverLoader,
  loaders // registry
} from './loaders/index.js';

// --- Startup Pipeline: runs ONCE at server boot ---
const startupPipeline = [
  envLoader,
  dbLoader,
  serviceLoader,
  modelLoader,
  actionLoader,
  handlerLoader,
  methodLoader,
  eventLoader,
  dataLoader,
  jsonLoader,
  middlewareLoader,
  routeLoader,
  authLoader,
  pubsubLoader,
  sdlLoader,
  typeLoader,
  populateTypeComposers,
  typeComposerLoader2,
  featureLoader,
  resolverLoader
];

/**
 * Build the base application context at startup.
 * @param {object} options - { logger, config, plugins }
 * @returns {Promise<{ ...context, createContext: function }>}
 */
export const buildAppContext = async ({ logger, config, plugins = [] } = {}) => {
  // Initial context
  let context = { logger, config, options: { logger, config } };

  // Plugin: beforeAll
  await Promise.all(plugins.map(p => p({ phase: 'beforeAll', context })));

  // Run the full startup pipeline
  context = await pipeAsync(...startupPipeline)(context);

  // Plugin: afterAll
  await Promise.all(plugins.map(p => p({ phase: 'afterAll', context })));

  // Per-request context factory (lightweight)
  const createContext = ({ req } = {}) => ({
    ...context,
    user: req?.user,
    requestId: req?.id,
    // Add any other per-request data here
  });

  return {
    ...context,
    createContext
  };
};

// Hot reload support
export const setupHotReload = (context, onReload) => {
  if (process.env.NODE_ENV === 'development' && onReload) {
    const watchers = Object.entries(createLoaders(context))
      .map(([type, loader]) =>
        watchFiles([`src/modules/**/*.${type}.js`], async () => {
          const result = await loader();
          onReload({ type, result });
        })
      );
    return () => watchers.forEach(w => w.close());
  }
  return () => {};
};

// Advanced loader composition patterns for public API
// Usage: import { runLoaderPipeline, runSelectedLoaders, runLoaderPhases, withLoaderMiddleware, loaderRegistry } from './createLoader.js';

// --- Alternative Loader Pipelines ---

/**
 * Full pipeline: all loaders in production order
 */
export const fullPipeline = [
  loaders.env,
  loaders.db,
  loaders.service,
  loaders.model,
  loaders.action,
  loaders.handler,
  loaders.method,
  loaders.event,
  loaders.data,
  loaders.json,
  loaders.middleware,
  loaders.route,
  loaders.auth,
  loaders.pubsub,
  loaders.sdl,
  loaders.type,
  loaders.populateTypeComposers,
  loaders.typeComposerLoader2,
  loaders.feature,
  loaders.resolver
];

/**
 * Minimal pipeline: for unit tests or fast startup
 */
export const minimalPipeline = [
  loaders.env,
  loaders.model,
  loaders.action
];

/**
 * Phased pipeline: loaders in phases (array of arrays)
 */
export const phasedPipeline = [
  [loaders.env, loaders.db, loaders.service],
  [loaders.model, loaders.action, loaders.handler],
  [loaders.populateTypeComposers, loaders.typeComposerLoader2, loaders.feature, loaders.resolver]
];

/**
 * Run a pipeline of loaders in order
 */
export const runLoaderPipeline = async (ctx, pipeline) => {
  let context = ctx;
  for (const loader of pipeline) {
    context = await loader(context);
  }
  return context;
};

/**
 * Run only selected loaders by name
 */
export const runSelectedLoaders = async (ctx, loaderMap, loaderNames) => {
  let context = ctx;
  for (const name of loaderNames) {
    if (loaderMap[name]) {
      context = await loaderMap[name](context);
    }
  }
  return context;
};

/**
 * Run loaders in phases (array of arrays)
 */
export const runLoaderPhases = async (ctx, loaderPhases) => {
  let context = ctx;
  for (const phase of loaderPhases) {
    for (const loader of phase) {
      context = await loader(context);
    }
  }
  return context;
};

// 4. Middleware/Enhancer: wrap a loader with middleware
export const withLoaderMiddleware = (loader, middleware) => async (ctx) => {
  await middleware(ctx, loader.name);
  return loader(ctx);
};

// 5. Registry with metadata (scaffold)
export const loaderRegistry = {
  // Example:
  // model: { loader: modelLoader, phase: 'core', description: 'Loads models' },
};

// Add more advanced patterns as needed. 