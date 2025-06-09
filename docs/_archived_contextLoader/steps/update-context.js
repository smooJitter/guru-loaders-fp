/**
 * @file
 * ARCHIVED PIPELINE STEP (Unfinished Modular System)
 *
 * This file was part of an experimental modular pipeline step system for loader composition.
 * It is archived for possible future use or inspiration. Not used in the current loader system.
 *
 * Intended purpose: Register processed modules into the context and set up hot reload if enabled.
 */
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