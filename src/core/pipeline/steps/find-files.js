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