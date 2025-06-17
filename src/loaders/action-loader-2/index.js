import { createLoader } from '../../utils/loader-utils.js';
import { extractActions } from './extractActions.js';
import { validateActionModule } from './validateActionModule.js';
import { getLoaderLogger } from '../../utils/loader-logger.js';

const ACTION_PATTERNS = [
  'src/**/*.actions.js',
  'src/**/*-actions/index.js',
];

/**
 * Transform: Extract and namespace actions
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object} Namespaced action registry
 */
const transformActions = (module, ctx) => {
  const logger = getLoaderLogger(ctx, {}, 'action-loader-2');
  return extractActions(module, ctx, logger);
};

/**
 * Create the action loader (namespaced)
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createActionLoader2 = (options = {}) =>
  createLoader('actions', {
    patterns: options.patterns || ACTION_PATTERNS,
    ...options,
    transform: (modules, ctx) => {
      const logger = getLoaderLogger(ctx, {}, 'action-loader-2');
      return extractActions(modules, ctx, logger);
    },
    validate: options.validate || validateActionModule,
  });

export const actionLoader2 = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createActionLoader2({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  const { context } = await loader(ctx);
  // Ensure actions is set on context
  if (!context.actions || typeof context.actions !== 'object') {
    context.actions = {};
  }
  return { actions: context.actions };
};

export default actionLoader2; 