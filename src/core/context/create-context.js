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