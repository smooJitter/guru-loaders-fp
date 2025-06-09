/**
 * @file
 * ARCHIVED: Context Factory (MVP-ready, not used in current app)
 *
 * This file provides a functional factory for building the base and per-request application context.
 * - Merges config, services, registries, and watcher state.
 * - Supports per-request injection of user, tenant, and request data.
 *
 * ## Intentions:
 * - To provide a single source of truth for all context/state needed by loaders, resolvers, and actions.
 * - To enable clean, testable, and extensible context creation for both app bootstrapping and per-request flows.
 *
 * ## MVP Readiness:
 * - The implementation is MVP-ready: it is pure, composable, and covers all core context needs.
 * - Not currently used by the main loader system, but can be integrated in future refactors.
 *
 * ## Requirements to reach MVP in a future app:
 * - Integrate with the main loader pipeline for context creation and request handling.
 * - Ensure all services and registries are injected via this factory.
 * - Add hooks or plugins for context extension if needed.
 *
 * This file is archived for possible future use or inspiration.
 */
import R from 'ramda';
import { merge } from '../../utils/fp-utils.js';

// Create base context with defaults
const createBaseContext = (defaults = {}) => ({
  logger: console,
  config: {},
  env: process.env.NODE_ENV || 'development',
  ...defaults
});

// Create services context
const createServicesContext = (services = {}) => ({
  db: null,
  pubsub: null,
  ...services
});

// Create registries context
const createRegistriesContext = () => ({
  models: {},
  types: {},
  actions: {},
  resolvers: {},
  routes: {}
});

// Create watchers context
const createWatchersContext = () => ({
  models: null,
  types: null,
  actions: null,
  resolvers: null,
  routes: null
});

// Create context factory
export const createContext = R.curry((defaults, services) => {
  const baseContext = createBaseContext(defaults);
  const servicesContext = createServicesContext(services);
  const registriesContext = createRegistriesContext();
  const watchersContext = createWatchersContext();

  return merge(
    baseContext,
    servicesContext,
    registriesContext,
    watchersContext
  );
});

// Create request context factory
export const createRequestContext = R.curry((baseContext, request) => {
  const { user, tenant, ...rest } = request;
  
  return merge(baseContext, {
    user: user || null,
    tenant: tenant || null,
    request: rest
  });
}); 