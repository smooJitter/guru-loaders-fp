import { getLoaderLogger } from '../../utils/loader-logger.js';
import { validateInput, runLifecycle } from '../../hooks/index.js';

/**
 * Ensures every model in context.models has a TypeComposer in context.typeComposers (ModelNameTC).
 * Uses context.schemaComposer and context.composeWithMongoose.
 * @param {object} context - Loader context (must have models, schemaComposer, composeWithMongoose)
 * @returns {Promise<{ typeComposers: object, schemaComposer: object, context: object }>}
 */
export const populateTypeComposers = async (context) => {
  const logger = getLoaderLogger(context, {}, 'populateTypeComposers');
  await runLifecycle('beforeAll', context);

  validateInput(context, {
    models: 'object',
    schemaComposer: 'object',
    composeWithMongoose: 'function',
  });

  context.typeComposers = context.typeComposers || {};

  for (const [modelName, mongooseModel] of Object.entries(context.models)) {
    const tcKey = `${modelName}TC`;
    if (!context.typeComposers[tcKey]) {
      try {
        logger.info(`Composing TypeComposer for model: ${modelName}`);
        const TC = context.composeWithMongoose(mongooseModel, { schemaComposer: context.schemaComposer });
        context.typeComposers[tcKey] = TC;
      } catch (err) {
        logger.error(`Error composing TypeComposer for ${modelName}:`, err);
        throw err;
      }
    }
  }

  await runLifecycle('afterAll', context);

  return {
    typeComposers: context.typeComposers,
    schemaComposer: context.schemaComposer,
    context
  };
}; 