import R from 'ramda';

// Module validation
export const validateModule = (type, module) => {
  const validators = {
    model: ({ name, schema, model }) => 
      name && schema && model,
    tc: ({ name, schema, tc }) => 
      name && schema && tc,
    actions: ({ name, methods }) => 
      name && methods,
    resolvers: ({ name, methods }) => 
      name && methods
  };
  return validators[type]?.(module) || false;
};

// Context validation
export const validateContext = R.curry((required, context) => {
  const missing = R.difference(required, R.keys(context));
  return R.isEmpty(missing) 
    ? context 
    : Promise.reject(new Error(`Missing context: ${missing.join(', ')}`));
});

// Circular dependency detection
export const detectCircularDeps = (modules) => {
  const graph = new Map();
  modules.forEach(({ name, dependencies }) => {
    graph.set(name, dependencies || []);
  });
  
  const visited = new Set();
  const recursionStack = new Set();
  
  const hasCycle = (node) => {
    if (!visited.has(node)) {
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(node);
    return false;
  };
  
  for (const node of graph.keys()) {
    if (hasCycle(node)) {
      return true;
    }
  }
  
  return false;
};

// Validate module dependencies
export const validateDependencies = (module, context) => {
  const { dependencies = [] } = module;
  const missing = dependencies.filter(dep => !context[dep]);
  return R.isEmpty(missing) 
    ? true 
    : Promise.reject(new Error(`Missing dependencies: ${missing.join(', ')}`));
};

// Validate module exports
export const validateExports = (type, module) => {
  const requiredExports = {
    model: ['name', 'schema', 'model'],
    tc: ['name', 'schema', 'tc'],
    actions: ['name', 'methods'],
    resolvers: ['name', 'methods']
  };
  
  const missing = requiredExports[type]?.filter(prop => !module[prop]) || [];
  return R.isEmpty(missing) 
    ? true 
    : Promise.reject(new Error(`Missing exports: ${missing.join(', ')}`));
}; 