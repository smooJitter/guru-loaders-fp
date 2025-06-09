/**
 * @file
 * ARCHIVED PIPELINE STEP (Unfinished Modular System)
 *
 * This file was part of an experimental modular pipeline step system for loader composition.
 * It is archived for possible future use or inspiration. Not used in the current loader system.
 *
 * Intended purpose: Discover files matching loader patterns and attach them to the context.
 */
import R from 'ramda';
import { findFiles } from '../../../utils/file-utils.js';

// Find files step
export const findFilesStep = R.curry((patterns, context) => {
  const files = findFiles(patterns);
  return {
    ...context,
    files
  };
}); 