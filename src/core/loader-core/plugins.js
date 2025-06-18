/**
 * Plugin and higher-order loader utilities for loader-utils-new.
 * Includes withPlugins, withMiddleware, withValidation.
 *
 * - Co-locate sync and async plugins for clarity and maintainability.
 * - Use clear naming (e.g., asyncLoggingPlugin) for async plugins.
 * - All HOFs (withPlugins, etc.) are async-friendly and work with both types.
 *
 * Example usage:
 * import { withPlugins, asyncLoggingPlugin } from './core/loader-core';
 * const loader = withPlugins([asyncLoggingPlugin])(createAsyncLoader(...));
 */
import { pipeAsync } from '../async-pipeline-utils.js';

// --- Sync Plugin Example ---
export const loggingPlugin = {
  before: ctx => { console.log('Before loading...'); return ctx; },
  after: ctx => { console.log('After loading!'); return ctx; }
};

// --- Async Plugin Example ---
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

export const withPlugins = (plugins = []) => (loader) => async (context) => {
  const beforeContext = await pipeAsync(...plugins.map(p => p.before || (x => x)))(context);
  const result = await loader(beforeContext);
  const afterContext = await pipeAsync(...plugins.map(p => p.after || (x => x)))(result.context);
  return { ...result, context: afterContext };
};

export const withMiddleware = (middleware = []) => (loader) => async (context) => {
  const middlewareContext = await pipeAsync(...middleware)(context);
  return loader(middlewareContext);
};

export const withValidation = (validators = []) => (loader) => async (context) => {
  await Promise.all(validators.map(v => v(context)));
  return loader(context);
}; 