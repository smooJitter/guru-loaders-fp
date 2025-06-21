import { createAsyncLoader } from '../../core/loader-core/loader-async.js';
import { importAndApplyAllTypeComposers } from './importAndApplyAllTypeComposers.js';

// QA: The transform returns only the changed/new TypeComposers for each module, using Ramda for diffing.
// The loader merges these into ctx.typeComposers after all modules are processed.
// After merging, assign to both ctx.typeComposers and context.typeComposers for test visibility.
const TYPE_COMPOSER_PATTERNS = [
  'src/**/*.tc.js',
  'src/**/*.type-composer.js',
  'src/features/*/*.tc.js',
  'src/features/*/*.type-composer.js',
];

export const createTypeComposerLoader = (options = {}) =>
  createAsyncLoader('typeComposers', {
    patterns: options.patterns || TYPE_COMPOSER_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll || importAndApplyAllTypeComposers,
    contextKey: 'typeComposers',
    ...options
  });

const typeComposerLoader = async (ctx = {}) => {
  ctx.typeComposers = ctx.typeComposers || {};
  const loader = createTypeComposerLoader({
    findFiles: ctx.findFiles,
    importAndApplyAll: ctx.importAndApplyAll,
  });
  const { context } = await loader(ctx);
  return { context };
};

export default typeComposerLoader; 