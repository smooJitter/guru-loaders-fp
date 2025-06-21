import { createAsyncLoader } from '../../core/loader-core';
import { composeTransforms } from '../../core/loader-core/transforms.js';

const DATA_PATTERNS = [
  '**/*.data.js',
  '**/data/**/*.index.js'
];

function validateDataLoaderDef(loader, file) {
  const errors = [];
  if (!loader) {
    errors.push(`DataLoader def is undefined or null in file: ${file}`);
  }
  if (typeof loader.model !== 'string') {
    errors.push(`Missing or invalid 'model' for data-loader '${loader.name ?? '[unknown]'}' in file: ${file}`);
  }
  if (typeof loader.name !== 'string') {
    errors.push(`Missing or invalid 'name' for data-loader in model '${loader.model ?? '[unknown]'}' in file: ${file}`);
  }
  if (typeof loader.batchFn !== 'function') {
    errors.push(`Missing or invalid 'batchFn' for data-loader '${loader.name ?? '[unknown]'}' in model '${loader.model ?? '[unknown]'}' in file: ${file}`);
  }
  return { valid: errors.length === 0, errors };
}

// Transform: validate, but do NOT instantiate DataLoader
const dataLoaderTransform = async (arr, ctx) => {
  console.log('[DEBUG dataLoaderTransform] input type:', Array.isArray(arr) ? 'array' : typeof arr, 'value:', arr);
  console.log('[DEBUG dataLoaderTransform] input:', JSON.stringify(arr, null, 2));
  
  // Handle module.default and function calls
  let normalized = arr;
  console.log('[DEBUG dataLoaderTransform] initial normalized:', normalized);
  if (normalized?.default) {
    normalized = normalized.default;
    console.log('[DEBUG dataLoaderTransform] after default:', normalized);
  }
  if (typeof normalized === 'function') {
    normalized = await normalized(ctx);
    console.log('[DEBUG dataLoaderTransform] after function call:', normalized);
  }
  const loaders = Array.isArray(normalized) ? normalized : [normalized];
  console.log('[DEBUG dataLoaderTransform] loaders:', loaders);
  
  // Filter valid loaders
  const filtered = loaders.filter(loader => {
    const { valid } = validateDataLoaderDef(loader, '');
    console.log('[DEBUG dataLoaderTransform] validating loader:', loader, 'valid:', valid);
    return valid;
  });
  console.log('DEBUG filtered loaders:', JSON.stringify(filtered, null, 2));
  return filtered;
};

// Custom registry strategy for data loaders
const dataLoaderStrategy = (name, mod) => ({
  [mod.model]: {
    [mod.name]: {
      batchFn: mod.batchFn,
      options: mod.options
    }
  }
});

export const createDataLoader = (options = {}) => {
  return createAsyncLoader('dataLoaderDefs', {
    patterns: options.patterns || DATA_PATTERNS,
    transforms: composeTransforms([dataLoaderTransform]),
    registryType: 'custom',
    customStrategies: {
      custom: dataLoaderStrategy
    },
    validateModule: (mod, file) => {
      const { valid, errors } = validateDataLoaderDef(mod, file);
      if (!valid && options.logger) {
        errors.forEach(err => options.logger.error?.(`[data-loader] ${err}`));
      }
      return valid;
    },
    ...options
  });
};

export const dataLoader = async (ctx = {}) => {
  const logger = ctx?.options?.logger || ctx?.services?.logger;
  const { context } = await createDataLoader({ 
    ...ctx,  // Include top-level context properties first
    ...ctx.options,  // Then overlay any options
    logger  // Finally ensure logger is set
  })(ctx);
  return { ...ctx, dataLoaderDefs: context.dataLoaderDefs };
};

export default dataLoader; 