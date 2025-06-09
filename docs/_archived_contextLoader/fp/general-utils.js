import R from 'ramda';

// Context Factory
export const createContextFactory = (defaults) => 
  R.curry((services, registries) => ({
    ...defaults,
    ...services,
    ...registries
  }));

// Registry Management
export const createRegistry = R.curry((type, modules) => {
  const registry = {};
  modules.forEach(({ name, ...rest }) => {
    registry[name] = rest;
  });
  return registry;
});

// Pipeline Composition
export const createPipeline = R.curry((steps, context) => 
  R.pipeP(...steps)(context)
);

// Error Handling
export const withErrorHandling = R.curry((fn, logger) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    logger?.error(error);
    throw error;
  }
});

// Module Transformation
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

// Registry Merging
export const mergeRegistries = R.curry((type, registries) => {
  return R.reduce(
    (acc, registry) => R.mergeDeepRight(acc, registry),
    {},
    registries
  );
});

// Module Dependency Graph
export const createDependencyGraph = R.curry((modules) => {
  return R.reduce(
    (graph, { name, dependencies = [] }) => 
      R.assoc(name, dependencies, graph),
    {},
    modules
  );
});

// String utilities
export const toCamelCase = str => 
  str.replace(/-([a-z])/g, g => g[1].toUpperCase());

export const capitalize = str => 
  str.charAt(0).toUpperCase() + str.slice(1);

// Object utilities
export const merge = (...objs) =>
  objs.reduce((acc, o) => R.mergeDeepRight(acc, o), {}); 