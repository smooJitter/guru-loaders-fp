export * from './logging.hook.js';
export * from './validation.hook.js';
export * from './errorHandling.hook.js';
export * from './contextInjection.hook.js';
export * from './lifecycle.hook.js';
export { contextInjectionHook as injectContext } from './contextInjection.hook.js';
export { logStart, logEnd } from './logging.hook.js';
export { validationHook as validateInput } from './validation.hook.js';

export const validateModels = (module, schema) => {
  if (module.models && Object.keys(module.models).length === 0) {
    throw new Error('No models provided');
  }
  return module;
};

export const runLifecycle = async () => {}; 