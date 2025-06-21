// plugins.js — loader-core
import { reduce, flatten, uniq, filter } from 'ramda';
import { isFunction } from 'ramda-adjunct';

/**
 * Example sync plugin: logs before and after loading.
 */
export const loggingPlugin = {
  before: ctx => { console.log('Before loading...'); return ctx; },
  after: ctx => { console.log('After loading!'); return ctx; }
};

/**
 * Example async plugin: logs before and after loading asynchronously.
 */
export const asyncLoggingPlugin = {
  before: async ctx => {
    await new Promise(res => setTimeout(res, 10));
    console.log('Async before loading...');
    return ctx;
  },
  after: async ctx => {
    await new Promise(res => setTimeout(res, 10));
    console.log('Async after loading!');
    return ctx;
  }
};

/**
 * Compose plugins (with before/after hooks) around a loader function.
 * Plugins are objects with optional async before(ctx) and after(ctx) methods.
 *
 * @param {Array} plugins - Array of plugin objects
 * @returns {Function} (loader) => async (context) => context
 */
export const withPlugins = (plugins = []) => (loader) => async (context) => {
  // Compose all before hooks
  const runBefore = async (ctx) =>
    await reduce(
      async (acc, plugin) =>
        isFunction(plugin.before) ? plugin.before(await acc) : acc,
      Promise.resolve(ctx),
      plugins
    );

  // Compose all after hooks
  const runAfter = async (ctx) =>
    await reduce(
      async (acc, plugin) =>
        isFunction(plugin.after) ? plugin.after(await acc) : acc,
      Promise.resolve(ctx),
      plugins
    );

  let ctx = await runBefore(context);
  ctx = await loader(ctx);
  ctx = await runAfter(ctx);
  return ctx;
};

/**
 * Compose middleware functions before the loader (Ramda-powered).
 * Middleware are async functions: (context) => context
 *
 * @param {Array} middleware - Array of middleware functions
 * @returns {Function} (loader) => async (context) => context
 */
export const withMiddleware = (middleware = []) => (loader) => async (context) => {
  const runMiddleware = async (ctx) =>
    await reduce(
      async (acc, mw) => isFunction(mw) ? mw(await acc) : acc,
      Promise.resolve(ctx),
      middleware
    );
  const ctx = await runMiddleware(context);
  return loader(ctx);
};

/**
 * Run validators before the loader (Ramda-powered).
 * Validators are async functions: (context) => void (throw on error)
 *
 * @param {Array} validators - Array of validator functions
 * @returns {Function} (loader) => async (context) => context
 */
export const withValidation = (validators = []) => (loader) => async (context) => {
  await Promise.all(
    (validators || []).filter(isFunction).map(v => v(context))
  );
  return loader(context);
};

/**
 * Compose multiple plugin arrays into a single, deduped array.
 * Useful for merging plugin sets from different sources.
 *
 * @param {...Array} pluginArrays - Arrays of plugin objects
 * @returns {Array} - Flattened, deduped array of plugins (by reference)
 */
export const composePlugins = (...pluginArrays) => uniq(flatten(pluginArrays));

/**
 * Filter plugins by a predicate (e.g., by name or feature flag).
 *
 * @param {Array} plugins - Array of plugin objects
 * @param {Function} predicate - Function(plugin) => boolean
 * @returns {Array} - Filtered array of plugins
 */
export const filterPlugins = (plugins, predicate) => filter(predicate, plugins);
