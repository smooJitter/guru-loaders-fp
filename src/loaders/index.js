// index.js — Loader Registry
// IMPORTANT: The order of imports and the loaders object reflects context loading priority.
// Do NOT alphabetize or reorder unless you understand the loader dependency graph.

import { envLoader } from './env-loader.js';
import { dbLoader } from './db-loader.js';
import { modelLoader } from './model-loader.js';
import { typeLoader } from './type-loader.js';
import actionLoader from './action-loader/index.js';
import { serviceLoader } from './service-loader.js';
import { resolverLoader } from './resolver-loader.js';
import { jsonLoader } from './json-loader.js';
import { sdlLoader } from './sdl-loader.js';
import { middlewareLoader } from './middleware-loader.js';
import { routeLoader } from './route-loader.js';
import { fakerLoader } from './faker-loader.js';
import { eventLoader } from './event-loader.js';
import dataLoader from './data-loader/data-loader.js';
import { pubsubLoader } from './pubsub-loader.js';
import { authLoader } from './auth-loader.js';
import typeComposerLoader from './type-composer-loader/index.js';
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
  feature: featureLoader,
  handler: handlerLoader,
  json: jsonLoader,
  middleware: middlewareLoader,
  model: modelLoader,
  pubsub: pubsubLoader,
  resolver: resolverLoader,
  route: routeLoader,
  sdl: sdlLoader,
  service: serviceLoader,
  type: typeLoader,
  typeComposer: typeComposerLoader,
};

// Individual exports
export {
  actionLoader,
  authLoader,
  dataLoader,
  dbLoader,
  envLoader,
  eventLoader,
  featureLoader,
  handlerLoader,
  jsonLoader,
  middlewareLoader,
  modelLoader,
  pubsubLoader,
  resolverLoader,
  routeLoader,
  sdlLoader,
  serviceLoader,
  typeLoader,
  typeComposerLoader
};

// See src/createLoader for advanced composition patterns (pipeline, phased, selective, etc.) 