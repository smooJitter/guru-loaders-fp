import { envLoader } from './env-loader.js';
import { dbLoader } from './db-loader.js';
import { modelLoader } from './model-loader.js';
import { typeLoader } from './type-loader.js';
import actionLoader from './action-loader-2/index.js';
import { methodLoader } from './method-loader.js';
import { serviceLoader } from './service-loader.js';
import { resolverLoader } from './resolver-loader.js';
import { jsonLoader } from './json-loader.js';
import { sdlLoader } from './sdl-loader.js';
import { middlewareLoader } from './middleware-loader.js';
import { routeLoader } from './route-loader.js';
import { fakerLoader } from './faker-loader.js';
import { eventLoader } from './event-loader.js';
import { serviceLoader as pluginLoader } from './plugin-loader.js';
import dataLoader from './data-loader/data-loader.js';
import { pubsubLoader } from './pubsub-loader.js';
import { authLoader } from './auth-loader.js';
import { populateTypeComposers } from './type-composer-loader-2/populateTypeComposers.js';
import typeComposerLoader2 from './type-composer-loader-2/index.js';
import handlerLoader from './handler-loader/index.js';
import featureLoader from './feature-loader/feature-loader.js';

// Flat loader registry
export const loaders = {
  action: actionLoader,
  auth: authLoader,
  data: dataLoader,
  db: dbLoader,
  env: envLoader,
  event: eventLoader,
  faker: fakerLoader,
  feature: featureLoader,
  handler: handlerLoader,
  json: jsonLoader,
  method: methodLoader,
  middleware: middlewareLoader,
  model: modelLoader,
  plugin: pluginLoader,
  populateTypeComposers,
  pubsub: pubsubLoader,
  resolver: resolverLoader,
  route: routeLoader,
  sdl: sdlLoader,
  service: serviceLoader,
  type: typeLoader,
  typeComposerLoader2
};

// Individual exports
export {
  actionLoader,
  authLoader,
  dataLoader,
  dbLoader,
  envLoader,
  eventLoader,
  fakerLoader,
  featureLoader,
  handlerLoader,
  jsonLoader,
  methodLoader,
  middlewareLoader,
  modelLoader,
  pluginLoader,
  populateTypeComposers,
  pubsubLoader,
  resolverLoader,
  routeLoader,
  sdlLoader,
  serviceLoader,
  typeLoader,
  typeComposerLoader2
};

// See src/createLoader for advanced composition patterns (pipeline, phased, selective, etc.) 