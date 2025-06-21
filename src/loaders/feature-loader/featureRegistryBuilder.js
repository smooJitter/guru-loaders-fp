import { mergeFeatureRegistries, reportDuplicates } from './merge.js';
import { getLoaderLogger } from '../../utils/loader-logger.js';

export const featureRegistryBuilder = (manifests, context) => {
  const { typeComposersList, queriesList, mutationsList, resolversList } =
    mergeFeatureRegistries(context, manifests);

  const logger = getLoaderLogger(context, {}, 'feature-loader');
  reportDuplicates(typeComposersList, queriesList, mutationsList, resolversList, logger);

  return {
    typeComposers: Object.assign({}, ...typeComposersList),
    queries: Object.assign({}, ...queriesList),
    mutations: Object.assign({}, ...mutationsList),
    resolvers: Object.assign({}, ...resolversList),
    features: manifests,
  };
}; 