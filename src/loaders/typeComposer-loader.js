// src/loaders/typeComposerLoader.js

import { SchemaComposer } from 'graphql-compose';
import { composeMongoose } from 'graphql-compose-mongoose';
import * as defaultHooks from '../hooks/index.js';
import logger from '../utils/logger.js';

/**
 * Build a shared SchemaComposer and a TypeComposer for each Mongoose model,
 * integrating validation, logging, context injection, and error handling hooks.
 * Optionally attaches results to context.
 *
 * @param {Object} options
 * @param {Object} options.models        – map of { [modelName]: MongooseModel }
 * @param {Object} [options.logger]      – optional logger
 * @param {Array<Function>} [options.plugins]
 * @param {Function} [options.onReload]  – callback to re-run this loader on hot reload
 * @param {Object} [options.hooks]       – dependency injection for hooks (for testing)
 *
 * @returns {Promise<{ schemaComposer: SchemaComposer, typeComposers: Record<string, any> }>} 
 */
export default async function typeComposerLoader({
  models,
  context,
  logger: customLogger = logger,
  plugins = [],
  onReload,
  hooks = defaultHooks
} = {}) {
  const {
    validateInput,
    logStart,
    logEnd,
    injectContext,
    withErrorHandling,
    runLifecycle
  } = hooks;

  // 1. Build the initial loader context
  const loaderContext = { models, logger: customLogger, plugins, ...(context || {}) };

  // 2. Lifecycle: beforeAll
  try {
    await runLifecycle('beforeAll', loaderContext);
  } catch (e) {
    customLogger.error('typeComposerLoader: beforeAll error:', e);
  }

  // 3. Input validation
  try {
    validateInput(loaderContext, { models: 'object' });
    if (!loaderContext.models || Object.keys(loaderContext.models).length === 0) {
      throw new TypeError('Module validation failed — models must be a non-empty object');
    }
  } catch (e) {
    customLogger.error('typeComposerLoader: validation failed:', e);
    await runLifecycle('onError', { error: e, ...loaderContext });
    throw e;
  }

  // 4. Context injection
  let injectedContext = loaderContext;
  try {
    injectedContext = injectContext(loaderContext) || loaderContext;
  } catch (e) {
    customLogger.error('typeComposerLoader: context injection failed:', e);
    await runLifecycle('onError', { error: e, ...loaderContext });
    throw e;
  }

  // 5. Prepare composers
  const schemaComposer = new SchemaComposer();
  const typeComposers = {};

  // 6. Compose all models (with error handling)
  const composeAllModels = withErrorHandling(async () => {
    for (const [modelName, mongooseModel] of Object.entries(injectedContext.models)) {
      try {
        logStart(`compose:${modelName}`, injectedContext);
        const TC = composeMongoose(mongooseModel, { schemaComposer });
        typeComposers[modelName] = TC;
        logEnd(`compose:${modelName}`, injectedContext);
      } catch (err) {
        customLogger.error(`typeComposerLoader: error composing model "${modelName}":`, err);
        throw err;
      }
    }
  }, {
    onError: async (err) => {
      await runLifecycle('onError', { error: err, ...injectedContext });
    }
  });

  try {
    await composeAllModels();
  } catch (err) {
    throw err;
  }

  // 7. Plugin/extension support (optional)
  if (Array.isArray(plugins)) {
    for (const plugin of plugins) {
      if (typeof plugin === 'function') {
        await plugin({ schemaComposer, typeComposers, context: injectedContext });
      }
    }
  }

  // 8. Attach to context if provided
  if (context) {
    context.typeComposers = typeComposers;
    context.schemaComposer = schemaComposer;
  }

  // 9. Hot reload support
  if (typeof onReload === 'function') {
    onReload(async () => {
      await typeComposerLoader({ models, context, logger: customLogger, plugins, onReload, hooks });
    });
  }

  // 10. Lifecycle: afterAll
  try {
    await runLifecycle('afterAll', injectedContext);
  } catch (e) {
    customLogger.error('typeComposerLoader: afterAll hook error:', e);
  }

  // 11. Return both composers and context (if provided)
  return context
    ? { context, schemaComposer, typeComposers }
    : { schemaComposer, typeComposers };
}
