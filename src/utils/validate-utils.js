import * as R from 'ramda';

// Module validation
export const validateModule = (type, module) => {
  if (!module || typeof module !== 'object') return false;
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
  if (!Array.isArray(required) || required.length === 0) return context;
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
  if (!module || typeof module !== 'object') return true;
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
    // Accept legacy shape
    const isLegacy = typeof module.name === 'string' && module.name.length > 0 && typeof module.methods === 'object' && module.methods !== null;
    // Accept array of { namespace, name, method }
    const isModernArray = Array.isArray(module) && module.every(
      r => r && typeof r.namespace === 'string' && typeof r.name === 'string' && typeof r.method === 'function'
    );
    // Accept object of { [namespace]: { [name]: fn } }
    const isModernObject = !Array.isArray(module) && Object.values(module).every(
      ns => ns && typeof ns === 'object' && Object.values(ns).every(fn => typeof fn === 'function')
    );
    // Accept modules with a default export that is a function, array, or object
    const def = module.default;
    const isDefaultFunction = typeof def === 'function';
    const isDefaultArray = Array.isArray(def) && def.every(
      r => r && typeof r.namespace === 'string' && typeof r.name === 'string' && typeof r.method === 'function'
    );
    const isDefaultObject = def && typeof def === 'object' && !Array.isArray(def) && Object.values(def).every(
      ns => ns && typeof ns === 'object' && Object.values(ns).every(fn => typeof fn === 'function')
    );
    if (isLegacy || isModernArray || isModernObject || isDefaultFunction || isDefaultArray || isDefaultObject) return true;
    return Promise.reject(new Error(`Missing or invalid exports for ${type}: must be legacy ({ name, methods }), array of { namespace, name, method }, object of { [namespace]: { [name]: fn } }, or a default export in one of these shapes`));
  }
  const missing = requiredExports[type]?.filter(prop => !module[prop]) || [];
  return R.isEmpty(missing) 
    ? true 
    : Promise.reject(new Error(`Missing exports: ${missing.join(', ')}`));
}; 