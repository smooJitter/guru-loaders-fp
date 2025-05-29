import R from 'ramda';
import { pipeAsync } from '../../utils/fp-utils.js';

// Validate required services
const validateServices = R.curry((required, context) => {
  const missing = R.difference(required, R.keys(context));
  return R.isEmpty(missing)
    ? context
    : Promise.reject(new Error(`Missing required services: ${missing.join(', ')}`));
});

// Validate required registries
const validateRegistries = R.curry((required, context) => {
  const missing = R.difference(required, R.keys(context));
  return R.isEmpty(missing)
    ? context
    : Promise.reject(new Error(`Missing required registries: ${missing.join(', ')}`));
});

// Validate environment
const validateEnvironment = (context) => {
  const { env } = context;
  return ['development', 'test', 'production'].includes(env)
    ? context
    : Promise.reject(new Error(`Invalid environment: ${env}`));
};

// Validate configuration
const validateConfig = R.curry((required, context) => {
  const { config } = context;
  const missing = R.difference(required, R.keys(config));
  return R.isEmpty(missing)
    ? context
    : Promise.reject(new Error(`Missing required config: ${missing.join(', ')}`));
});

// Validate request context
const validateRequestContext = (context) => {
  const { user, tenant, request } = context;
  return user && tenant && request
    ? context
    : Promise.reject(new Error('Invalid request context'));
};

// Create validation pipeline
export const createValidationPipeline = R.curry((options = {}, context) => {
  const {
    requiredServices = [],
    requiredRegistries = [],
    requiredConfig = []
  } = options;

  return pipeAsync(
    validateServices(requiredServices),
    validateRegistries(requiredRegistries),
    validateEnvironment,
    validateConfig(requiredConfig)
  )(context);
});

// Create request validation pipeline
export const createRequestValidationPipeline = () => 
  pipeAsync(validateRequestContext); 