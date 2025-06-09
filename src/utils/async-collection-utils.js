// =============================
// 2. Async Collection Helpers
// =============================

export const mapAsync = (fn) => async (items) =>
  Array.isArray(items) ? Promise.all(items.map(fn)) : [];

export const filterAsync = (fn) => async (items) => {
  if (!Array.isArray(items)) return [];
  const results = await Promise.all(items.map(fn));
  return items.filter((_, i) => results[i]);
};

export const reduceAsync = (fn, initial) => async (items) => {
  let result = initial;
  for (const item of items) {
    result = await fn(result, item);
  }
  return result;
};

export const groupByAsync = (fn) => async (items) => {
  if (!Array.isArray(items)) return {};
  const groups = {};
  for (const item of items) {
    const key = await fn(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
  }
  return groups;
};

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

export const sortAsync = (fn) => async (items) => {
  const results = await Promise.all(items.map(fn));
  return items
    .map((item, i) => ({ item, value: results[i] }))
    .sort((a, b) => a.value - b.value)
    .map(({ item }) => item);
};

export const uniqueAsync = (fn) => async (items) => {
  const results = await Promise.all(items.map(fn));
  return items.filter((_, i) => 
    results.indexOf(results[i]) === i
  );
};
