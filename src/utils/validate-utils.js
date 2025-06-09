import * as R from 'ramda';

// Module validation
export const validateModule = (type, module) => {
  // LEGACY: For actions/resolvers, only support { name, methods } where:
  // - name: non-empty string
  // - methods: object (can be empty, but must exist)
  const validators = {
    model: ({ name, schema, model }) => 
      name && schema && model,
    tc: ({ name, schema, tc }) => 
      name && schema && tc,
    actions: ({ name, methods }) =>
      typeof name === 'string' && name.length > 0 && typeof methods === 'object' && methods !== null,
    resolvers: ({ name, methods }) =>
      typeof name === 'string' && name.length > 0 && typeof methods === 'object' && methods !== null
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
  const { dependencies } = module;
  const deps = Array.isArray(dependencies) ? dependencies : [];
  const missing = deps.filter(dep => !context[dep]);
  return R.isEmpty(missing) 
    ? true 
    : Promise.reject(new Error(`Missing dependencies: ${missing.join(', ')}`));
};

// Validate module exports
export const validateExports = (type, module) => {
  // LEGACY: For actions/resolvers, only support { name, methods } where:
  // - name: non-empty string
  // - methods: object (can be empty, but must exist)
  const requiredExports = {
    model: ['name', 'schema', 'model'],
    tc: ['name', 'schema', 'tc'],
    actions: [], // Custom check below
    resolvers: [] // Custom check below
  };
  if (type === 'actions' || type === 'resolvers') {
    const valid = typeof module.name === 'string' && module.name.length > 0 && typeof module.methods === 'object' && module.methods !== null;
    return valid
      ? true
      : Promise.reject(new Error(`Missing or invalid exports for legacy ${type}: { name: string, methods: object } required`));
  }
  const missing = requiredExports[type]?.filter(prop => !module[prop]) || [];
  return R.isEmpty(missing) 
    ? true 
    : Promise.reject(new Error(`Missing exports: ${missing.join(', ')}`));
}; 