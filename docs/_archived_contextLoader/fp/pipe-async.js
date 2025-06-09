import R from 'ramda';

export const pipeAsync = (...fns) => {
  return async (initialValue) => {
    return fns.reduce(
      async (result, fn) => fn(await result),
      initialValue
    );
  };
}; 