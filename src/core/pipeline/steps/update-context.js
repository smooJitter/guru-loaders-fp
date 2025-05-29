import R from 'ramda';
import { createRegistry, setupHotReload } from '../../../utils/loader-utils.js';

// Update context step
export const updateContextStep = R.curry((type, context) => {
  const { modules, watch = false } = context;
  
  // Create registry
  const registry = createRegistry(modules);
  
  // Setup hot reload if needed
  const cleanup = watch ? setupHotReload(type, context) : () => {};
  
  return {
    ...context,
    [type]: registry,
    watchers: {
      ...context.watchers,
      [type]: cleanup
    }
  };
}); 