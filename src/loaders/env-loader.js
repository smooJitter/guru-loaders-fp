import { createAsyncLoader, composeTransforms, transformRegistry } from '../core/loader-core';

const ENV_PATTERNS = {
  default: '**/*.env.js'
};

// Compose transforms: inject context only (unwrapping is now handled in loader-core)
const envTransforms = composeTransforms([
  transformRegistry.injectContext
]);

// Custom flat strategy: just use the env object as-is
const customStrategies = {
  flat: (name, mod) => ({ [name]: mod })
};

const loader = createAsyncLoader('envs', {
  patterns: ENV_PATTERNS,
  transforms: envTransforms,
  registryType: 'flat',
  validateModule: m => !!m && typeof m.name === 'string',
  customStrategies
});

export const envLoader = async (ctx = {}) => {
  const { context } = await loader(ctx);
  context.envs = context.envs || context['envs'] || {};
  // Debug: print the final envs registry
  if (context.services?.logger) {
    context.services.logger.info('[env-loader] Final envs registry:', context.envs);
  } else {
    console.info('[env-loader] Final envs registry:', context.envs);
  }
  return { envs: context.envs };
};

export default envLoader;