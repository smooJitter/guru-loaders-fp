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