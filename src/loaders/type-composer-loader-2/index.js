import { createLoader } from '../../utils/loader-utils.js';
import { getLoaderLogger } from '../../utils/loader-logger.js';

const TYPE_COMPOSER_PATTERNS = [
  'src/**/*.tc.js',
  'src/**/*.type-composer.js',
  'src/features/*/*.tc.js',
  'src/features/*/*.type-composer.js',
];

/**
 * Transform: For each typeComposer file, import and execute its default export as a factory with context.
 * The factory should check/create/extend the relevant TypeComposer in context.typeComposers.
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object} The updated typeComposers registry (not a new registry, but for loader-utils compatibility)
 */
const transformTypeComposer = async (module, ctx) => {
  const logger = getLoaderLogger(ctx, {}, 'type-composer-loader-2');
  if (!module || typeof module.default !== 'function') {
    logger.warn('type-composer-loader-2: Skipping module without a default factory export.');
    return ctx.typeComposers || {};
  }
  // The factory is responsible for checking/creating/extending the TC in context
  try {
    await module.default(ctx);
  } catch (err) {
    logger.error('type-composer-loader-2: Error executing typeComposer factory:', err);
    throw err;
  }
  // Return the registry for loader-utils compatibility
  return ctx.typeComposers || {};
};

/**
 * Validate: Ensure the module exports a default function
 * @param {string} type - The loader type ("typeComposers")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
const validateTypeComposerModule = (type, module) => {
  return module && typeof module.default === 'function';
};

/**
 * Create the type-composer loader (file-based, context-driven)
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createTypeComposerLoader2 = (options = {}) =>
  createLoader('typeComposers', {
    patterns: options.patterns || TYPE_COMPOSER_PATTERNS,
    ...options,
    transform: options.transform || transformTypeComposer,
    validate: options.validate || validateTypeComposerModule,
  });

export default createTypeComposerLoader2(); 