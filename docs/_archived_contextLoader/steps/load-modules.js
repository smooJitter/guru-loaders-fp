/**
 * @file
 * ARCHIVED PIPELINE STEP (Unfinished Modular System)
 *
 * This file was part of an experimental modular pipeline step system for loader composition.
 * It is archived for possible future use or inspiration. Not used in the current loader system.
 *
 * Intended purpose: Dynamically import discovered files and attach loaded modules to the context.
 */
import R from 'ramda';
import { importAndApply, mapAsync } from '../../../utils/fp-utils.js';

// Load modules step
export const loadModulesStep = R.curry((type, context) => {
  const { files } = context;
  
  return mapAsync(
    file => importAndApply(file, context)
  )(files).then(modules => ({
    ...context,
    modules
  }));
}); 