import R from 'ramda';

// Pipeline composition
export const pipeAsync = (...fns) => 
  async (value) => fns.reduce(
    (promise, fn) => promise.then(fn),
    Promise.resolve(value)
  );

// Async compose
export const composeAsync = (...fns) => 
  pipeAsync(...fns.reverse());

// Safe async pipe
export const safePipeAsync = (...fns) => 
  async (value) => {
    try {
      return await pipeAsync(...fns)(value);
    } catch (error) {
      console.error('Error in safePipeAsync:', error);
      throw error;
    }
  };

// Safe async compose
export const safeComposeAsync = (...fns) => 
  safePipeAsync(...fns.reverse());

// Tap async
export const tapAsync = (fn) => async (value) => {
  await fn(value);
  return value;
};

// Map async
export const mapAsync = (fn) => async (items) => 
  Promise.all(items.map(fn));

// Filter async
export const filterAsync = (fn) => async (items) => {
  const results = await Promise.all(items.map(fn));
  return items.filter((_, i) => results[i]);
};

// Reduce async
export const reduceAsync = (fn, initial) => async (items) => {
  let result = initial;
  for (const item of items) {
    result = await fn(result, item);
  }
  return result;
};

// Group by async
export const groupByAsync = (fn) => async (items) => {
  const groups = {};
  for (const item of items) {
    const key = await fn(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
  }
  return groups;
};

// Partition async
export const partitionAsync = (fn) => async (items) => {
  const results = await Promise.all(items.map(fn));
  return items.reduce(
    ([pass, fail], item, i) => 
      results[i] 
        ? [[...pass, item], fail]
        : [pass, [...fail, item]],
    [[], []]
  );
};

// Sort async
export const sortAsync = (fn) => async (items) => {
  const results = await Promise.all(items.map(fn));
  return items
    .map((item, i) => ({ item, value: results[i] }))
    .sort((a, b) => a.value - b.value)
    .map(({ item }) => item);
};

// Unique async
export const uniqueAsync = (fn) => async (items) => {
  const results = await Promise.all(items.map(fn));
  return items.filter((_, i) => 
    results.indexOf(results[i]) === i
  );
};

// Debounce async
export const debounceAsync = (fn, ms) => {
  let timeout;
  return async (...args) => {
    clearTimeout(timeout);
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        resolve(await fn(...args));
      }, ms);
    });
  };
};

// Throttle async
export const throttleAsync = (fn, ms) => {
  let last = 0;
  return async (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      return fn(...args);
    }
  };
};

// Retry async
export const retryAsync = (fn, { max = 3, delay = 1000 } = {}) => 
  async (...args) => {
    let lastError;
    for (let i = 0; i < max; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (i < max - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    }
    throw lastError;
  };

// Cache async
export const cacheAsync = (fn, { ttl = 60000 } = {}) => {
  const cache = new Map();
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    const value = await fn(...args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
};

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