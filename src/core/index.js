import R from 'ramda';
import { createContext, createRequestContext } from './context/create-context.js';
import { createValidationPipeline, createRequestValidationPipeline } from './context/validate-context.js';
import { createLoader } from './pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// Create application
export const createApp = R.curry((options = {}) => {
  const {
    defaults = {},
    services = {},
    plugins = []
  } = options;

  // Create base context
  const context = createContext(defaults, services);

  // Create validation pipeline
  const validateContext = createValidationPipeline({
    requiredServices: ['db', 'pubsub'],
    requiredRegistries: ['models', 'types', 'actions', 'resolvers', 'routes'],
    requiredConfig: ['env']
  });

  // Create loaders using the single factory
  const loaders = {
    models: createLoader('model', { watch: true }),
    types: createLoader('tc', { watch: true }),
    actions: createLoader('actions', { watch: true }),
    resolvers: createLoader('resolvers', { watch: true }),
    routes: createLoader('routes', { watch: true })
  };

  // Create application pipeline
  const app = async () => {
    try {
      // Validate context
      const validContext = await validateContext(context);

      // Run loaders
      const result = await pipeAsync(
        loaders.models,
        loaders.types,
        loaders.actions,
        loaders.resolvers,
        loaders.routes
      )(validContext);

      return result;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  };

  // Create request handler
  const handleRequest = R.curry(async (request) => {
    try {
      // Create request context
      const requestContext = createRequestContext(context, request);

      // Validate request context
      const validRequestContext = await createRequestValidationPipeline()(requestContext);

      return validRequestContext;
    } catch (error) {
      console.error('Error handling request:', error);
      throw error;
    }
  });

  return {
    app,
    handleRequest
  };
}); 