import mongoose from 'mongoose';
import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { buildFlatRegistryByModelName } from '../core/loader-core/lib/registry-builders.js';
import * as R from 'ramda';

/**
 * Modern Model Loader: Discovers, imports, and registers all Mongoose models using context-injected utilities.
 * - Supports both direct model and factory function exports.
 * - Registers models on both mongoose.models and context.models (flat registry).
 * - Uses only context-injected findFiles and importModule (no static imports except mongoose).
 * - Provides a cleanup function to remove loaded models from mongoose.models.
 * - Uses context.services.logger or console for logging.
 * - Returns { models, cleanup, error }.
 * - All logic is async and composable.
 */

// --- Pure, future-proof loader: returns both local and global registries ---

const MODEL_PATTERNS = [
  '**/*.model.js'
];

function isValidMongooseModel(model) {
  return model && typeof model.modelName === 'string' && typeof model.findById === 'function';
}

export const createModelLoader = (options = {}) => {
  return createAsyncLoader('models', {
    patterns: MODEL_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll,
    validate: isValidMongooseModel,
    // No-op registryBuilder: we only care about side effects
    registryBuilder: modules => modules, // Pass through for local registry
    contextKey: 'models',
    ...options,
  });
};

const modelLoader = async (context = {}) => {
  const mongooseConnection = context.mongooseConnection || mongoose;
  const loader = createModelLoader({
    findFiles: context.findFiles,
    importAndApplyAll: context.importAndApplyAll,
  });
  try {
    // 1. Discover, import, and register all model files
    const loaderResult = await loader(context);
    // 2. Build a local registry of just the models loaded by this run
    //    This enables test isolation, feature-based loading, and composability.
    const loadedModels = buildFlatRegistryByModelName(loaderResult.models);
    // 3. Clone the full global registry for compatibility
    const models = R.clone(mongooseConnection.models);
    // 4. Cleanup only the models loaded by this run
    const cleanup = () => {
      Object.keys(loadedModels).forEach(modelName => {
        delete mongooseConnection.models[modelName];
      });
    };
    // 5. Return a new context object with both registries and cleanup attached
    return R.mergeRight(context, { models, loadedModels, cleanup });
  } catch (error) {
    const models = R.clone(mongooseConnection.models);
    const cleanup = () => {};
    return R.mergeRight(context, { models, loadedModels: {}, cleanup, error });
  }
};

export default modelLoader; 