import * as R from 'ramda';
// import * as RA from 'ramda-adjunct';
import { mergeRegistries } from '../../utils/registry-utils.js';

function findDuplicates(lists) {
  return R.pipe(
    R.chain(R.keys),
    R.countBy(R.identity),
    R.toPairs,
    R.filter(([_, count]) => count > 1),
    R.map(R.head)
  )(lists);
}

export function mergeFeatureRegistries(context, featureManifests) {
  const typeComposersList = featureManifests.map(m => m.typeComposers || {});
  const queriesList = featureManifests.map(m => m.queries || {});
  const mutationsList = featureManifests.map(m => m.mutations || {});
  const resolversList = featureManifests.map(m => m.resolvers || {});

  context.typeComposers = Object.assign({}, context.typeComposers, ...typeComposersList);
  context.queries = Object.assign({}, context.queries, ...queriesList);
  context.mutations = Object.assign({}, context.mutations, ...mutationsList);
  context.resolvers = Object.assign({}, context.resolvers, ...resolversList);

  return { typeComposersList, queriesList, mutationsList, resolversList };
}

export function reportDuplicates(typeComposersList, queriesList, mutationsList, resolversList, logger) {
  const dupTC = findDuplicates(typeComposersList);
  const dupQ = findDuplicates(queriesList);
  const dupM = findDuplicates(mutationsList);
  const dupR = findDuplicates(resolversList);
  if (!R.isEmpty(dupTC)) logger.error('featureLoader: Duplicate typeComposers:', dupTC);
  if (!R.isEmpty(dupQ)) logger.error('featureLoader: Duplicate queries:', dupQ);
  if (!R.isEmpty(dupM)) logger.error('featureLoader: Duplicate mutations:', dupM);
  if (!R.isEmpty(dupR)) logger.error('featureLoader: Duplicate resolvers:', dupR);
} 