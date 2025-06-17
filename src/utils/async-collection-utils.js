// =============================
// 2. Async Collection Helpers
// =============================

// Concurrency-limited async pool
export async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export const mapAsync = (fn, options = {}) => async (items) => {
  if (!Array.isArray(items)) return [];
  if (options.concurrency) {
    return asyncPool(options.concurrency, items, fn);
  }
  return Promise.all(items.map(fn));
};

export const filterAsync = (fn, options = {}) => async (items) => {
  if (!Array.isArray(items)) return [];
  const results = options.concurrency
    ? await asyncPool(options.concurrency, items, fn)
    : await Promise.all(items.map(fn));
  return items.filter((_, i) => results[i]);
};

export const reduceAsync = (fn, initial) => async (items) => {
  let result = initial;
  for (const item of items) {
    result = await fn(result, item);
  }
  return result;
};

export const groupByAsync = (fn, options = {}) => async (items) => {
  if (!Array.isArray(items)) return {};
  const keys = options.concurrency
    ? await asyncPool(options.concurrency, items, fn)
    : await Promise.all(items.map(fn));
  const groups = {};
  items.forEach((item, i) => {
    const key = keys[i];
    groups[key] = groups[key] || [];
    groups[key].push(item);
  });
  return groups;
};

export const partitionAsync = (fn, options = {}) => async (items) => {
  if (!Array.isArray(items)) return [[], []];
  const results = options.concurrency
    ? await asyncPool(options.concurrency, items, fn)
    : await Promise.all(items.map(fn));
  return items.reduce(
    ([pass, fail], item, i) =>
      results[i] ? [[...pass, item], fail] : [pass, [...fail, item]],
    [[], []]
  );
};

export const sortAsync = (fn, options = {}) => async (items) => {
  if (!Array.isArray(items)) return [];
  const results = options.concurrency
    ? await asyncPool(options.concurrency, items, fn)
    : await Promise.all(items.map(fn));
  return items
    .map((item, i) => ({ item, value: results[i] }))
    .sort((a, b) => a.value - b.value)
    .map(({ item }) => item);
};

export const uniqueAsync = (fn, options = {}) => async (items) => {
  if (!Array.isArray(items)) return [];
  const results = options.concurrency
    ? await asyncPool(options.concurrency, items, fn)
    : await Promise.all(items.map(fn));
  return items.filter((_, i) => results.indexOf(results[i]) === i);
};
