// =============================
// 4. Registry & Pipeline Management
// =============================
import * as R from 'ramda';

export const createContextFactory = (defaults) => 
  R.curry((services, registries) => ({
    ...defaults,
    ...services,
    ...registries
  }));

export const createRegistry = R.curry((type, modules) => {
  const registry = {};
  modules.forEach(({ name, ...rest }) => {
    if (typeof name !== 'string') return;
    registry[name] = rest;
  });
  return registry;
});

export const createPipeline = R.curry((steps, context) =>
  steps.reduce((p, step) => p.then(step), Promise.resolve(context))
);

export const transformModule = R.curry((type, module) => {
  const transformers = {
    model: R.pipe(
      R.assoc('type', 'model'),
      R.assoc('timestamp', Date.now())
    ),
    tc: R.pipe(
      R.assoc('type', 'tc'),
      R.assoc('timestamp', Date.now())
    ),
    actions: R.pipe(
      R.assoc('type', 'actions'),
      R.assoc('timestamp', Date.now())
    ),
    resolvers: R.pipe(
      R.assoc('type', 'resolvers'),
      R.assoc('timestamp', Date.now())
    )
  };
  return transformers[type]?.(module) || module;
});

export const mergeRegistries = R.curry((type, registries) => {
  return R.reduce(
    (acc, registry) => R.mergeDeepRight(acc, registry),
    {},
    registries
  );
});

export const createDependencyGraph = R.curry((modules) => {
  return R.reduce(
    (graph, { name, dependencies = [] }) => 
      R.assoc(name, dependencies, graph),
    {},
    modules
  );
});
