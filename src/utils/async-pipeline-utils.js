// =============================
// 1. Async Pipeline Composition
// =============================
import * as R from 'ramda';

export const pipeAsync = (...fns) => 
  async (value) => fns.reduce(
    (promise, fn) => promise.then(fn),
    Promise.resolve(value)
  );

export const composeAsync = (...fns) => 
  pipeAsync(...fns.reverse());

export const safePipeAsync = (...fns) => 
  async (value) => {
    try {
      return await pipeAsync(...fns)(value);
    } catch (error) {
      console.error('Error in safePipeAsync:', error);
      throw error;
    }
  };

export const safeComposeAsync = (...fns) => 
  safePipeAsync(...fns.reverse());

export const tapAsync = (fn) => async (value) => {
  await fn(value);
  return value;
};
