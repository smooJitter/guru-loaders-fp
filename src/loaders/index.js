import { createPipeline } from '../core/pipeline/create-pipeline.js';
import { createModelLoader } from './model-loader.js';
import { createTypeLoader } from './type-loader.js';
import { createActionLoader } from './action-loader.js';
import { createMethodLoader } from './method-loader.js';
import { createResolverLoader } from './resolver-loader.js';
import { createRouteLoader } from './route-loader.js';
import { createJsonLoader } from './json-loader.js';
import { createMiddlewareLoader } from './middleware-loader.js';
import { createSdlLoader } from './sdl-loader.js';
import { createEnvLoader } from './env-loader.js';
import { createDbLoader } from './db-loader.js';
import { createFakerLoader } from './faker-loader.js';
import { createDataLoader } from './data-loader.js';
import { createPubsubLoader } from './pubsub-loader.js';
import { createAuthLoader } from './auth-loader.js';
import { createPluginLoader } from './plugin-loader.js';

export const createLoader = (type) => {
  const pipeline = createPipeline(type);
  
  return async (context) => {
    try {
      return await pipeline(context);
    } catch (error) {
      context.logger.error(`Error in ${type} loader:`, error);
      throw error;
    }
  };
};

// Create all loaders
export const createLoaders = (options = {}) => ({
  // Core loaders (load first)
  env: createEnvLoader(options),
  db: createDbLoader(options),
  auth: createAuthLoader(options),
  // Feature loaders
  models: createModelLoader(options),
  types: createTypeLoader(options),
  actions: createActionLoader(options),
  methods: createMethodLoader(options),
  resolvers: createResolverLoader(options),
  routes: createRouteLoader(options),
  json: createJsonLoader(options),
  middleware: createMiddlewareLoader(options),
  sdl: createSdlLoader(options),
  // Development loaders
  faker: createFakerLoader(options),
  // Data loaders
  data: createDataLoader(options),
  // Event loaders
  pubsub: createPubsubLoader(options),
  // Plugin loaders
  plugin: createPluginLoader(options)
});

// Export individual loaders
export {
  createModelLoader,
  createTypeLoader,
  createActionLoader,
  createMethodLoader,
  createResolverLoader,
  createRouteLoader,
  createJsonLoader,
  createMiddlewareLoader,
  createSdlLoader,
  createEnvLoader,
  createDbLoader,
  createFakerLoader,
  createDataLoader,
  createPubsubLoader,
  createAuthLoader,
  createPluginLoader
}; 