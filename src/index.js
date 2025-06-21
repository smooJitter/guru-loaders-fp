// Public API: Loader composition, pipelines, and loader registry
export {
  buildAppContext,
  fullPipeline,
  minimalPipeline,
  phasedPipeline,
  runLoaderPipeline,
  runSelectedLoaders,
  runLoaderPhases,
  loaders // expose the loader registry
} from './createLoaders.js';
export { pipeAsync } from './utils/async-pipeline-utils.js';
export * from './core/loader-core/index.js'; // expose loader-core utilities