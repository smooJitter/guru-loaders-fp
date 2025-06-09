import * as R from 'ramda';
// import * as RA from 'ramda-adjunct';
import { runLifecycle, validateInput, injectContext } from '../../hooks/index.js';

export function validateFeatureContext(context) {
  if (Object.prototype.toString.call(context) !== '[object Object]') throw new TypeError('Context must be a plain object');
  return validateInput(context, {
    schemaComposer: 'object',
    typeComposers: 'object',
    queries: 'object',
    mutations: 'object',
    resolvers: 'object'
  });
}

export function injectFeatureContext(context) {
  const injected = injectContext(context);
  return R.isNil(injected) ? context : injected;
}

export async function runFeatureLifecycle(hook, context) {
  if (R.isNil(hook)) return;
  return runLifecycle(hook, context);
} 