import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../../hooks/index.js';
import { getLoaderLogger } from '../../utils/loader-logger.js';
import DataLoader from 'dataloader';

const DATA_PATTERNS = {
  default: '**/*.data.js',
  index: '**/data/**/*.index.js'
};

const dataLoaderSchema = {
  name: 'string',
  model: 'string',
  batchFn: 'function',
  options: ['object', 'undefined']
};

export const dataLoader = async (ctx) => {
  const options = ctx.options || {};
  const patterns = options.patterns || DATA_PATTERNS;
  const findFiles = options.findFiles;
  const importModule = options.importModule;
  const logger = getLoaderLogger(ctx, options, 'data-loader');

  return errorHandlingHook(async () => {
    loggingHook(ctx, 'Loading data loader modules');
    const files = findFiles ? findFiles(patterns.default) : [];
    const modules = importModule
      ? await Promise.all(files.map(file => importModule(file, ctx)))
      : [];
    // Compose namespaced registry: { [model]: { [name]: loaderObj } }
    const registry = {};
    for (let i = 0; i < modules.length; i++) {
      let dataObjs;
      try {
        dataObjs = typeof modules[i].default === 'function'
          ? modules[i].default({ services: ctx?.services, config: ctx?.config })
          : modules[i].default;
        const dataList = Array.isArray(dataObjs) ? dataObjs : [dataObjs];
        for (const dataObj of dataList) {
          validationHook(dataObj, dataLoaderSchema);
          const injected = contextInjectionHook(dataObj, { services: ctx?.services, config: ctx?.config });
          const { model, name } = injected;
          if (!model || !name) {
            throw new Error('Data loader must have both model and name properties');
          }
          if (!registry[model]) registry[model] = {};
          if (registry[model][name]) {
            logger.warn(`Duplicate data-loader for model '${model}' and name '${name}'`);
          }
          registry[model][name] = {
            ...injected,
            type: 'data',
            timestamp: Date.now(),
            // DataLoader: DataLoader // For future use, not instantiated here
          };
        }
      } catch (err) {
        logger.warn(`Invalid or missing data-loader in file: ${files[i]}: ${err.message}`);
      }
    }
    return { ...ctx, dataLoaders: registry };
  }, ctx);
};

export default dataLoader; 