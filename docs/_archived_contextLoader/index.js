/**
 * @file
 * ARCHIVED: Core App Entrypoint (Legacy, not used in current app)
 *
 * This file was the main entrypoint for the original core system.
 * - Handles app creation, context setup, validation, and loader orchestration.
 * - Relies on the (now archived) context and validation logic.
 *
 * ## Intentions:
 * - To provide a single function for bootstrapping the app and handling requests.
 * - To enforce context and validation best practices at the core level.
 *
 * ## Legacy Status:
 * - Not used by the current loader system or any active code.
 * - Archived for reference or possible future use.
 *
 * ## Requirements to reach MVP in a future app:
 * - Update to use the new loader pipeline and context system.
 * - Integrate with current service and registry injection patterns.
 * - Ensure compatibility with plugin and extension hooks.
 *
 * This file is archived for possible future use or inspiration.
 */
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