import R from 'ramda';
import { validateModule, detectCircularDeps, validateDependencies, validateExports } from '../../../utils/validate-utils.js';
import { filterAsync, mapAsync } from '../../../utils/fp-utils.js';

// Process modules step
export const processModulesStep = R.curry((type, context) => {
  const { modules } = context;
  
  return Promise.all([
    // Validate modules
    filterAsync(
      module => validateModule(type, module)
    )(modules),
    
    // Check for circular dependencies
    detectCircularDeps(modules),
    
    // Validate dependencies
    Promise.all(
      modules.map(module => validateDependencies(module, context))
    ),
    
    // Validate exports
    Promise.all(
      modules.map(module => validateExports(type, module))
    )
  ]).then(([validModules, hasCircularDeps, depsValid, exportsValid]) => {
    if (hasCircularDeps) {
      throw new Error(`Circular dependencies detected in ${type} modules`);
    }
    
    return {
      ...context,
      modules: validModules
    };
  });
}); 