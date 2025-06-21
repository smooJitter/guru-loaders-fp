// Canonical mocks for registry builder tests

// Flat registry input/output
export const flatModules = [
  { name: 'foo', value: 1 },
  { name: 'bar', value: 2 }
];
export const flatRegistry = {
  foo: { name: 'foo', value: 1 },
  bar: { name: 'bar', value: 2 }
};

// Namespaced registry input/output
export const namespacedModules = [
  { namespace: 'ns1', name: 'foo', method: () => 1 },
  { namespace: 'ns2', name: 'bar', method: () => 2 }
];
export const namespacedRegistry = {
  ns1: { foo: expect.any(Function) },
  ns2: { bar: expect.any(Function) }
};

// Hierarchical registry input/output
export const hierarchicalModules = [
  { name: 'User.byId', value: () => 1 },
  { name: 'User.byEmail', value: () => 2 }
];
export const hierarchicalRegistry = {
  User: {
    byId: expect.any(Function),
    byEmail: expect.any(Function)
  }
};

// Advanced: Deeply nested hierarchical modules
export const deepHierarchicalModules = [
  { name: 'User.profile.settings.theme', value: 'dark' },
  { name: 'User.profile.settings.language', value: 'en' },
  { name: 'User.profile.info', value: { age: 30 } }
];
export const deepHierarchicalRegistry = {
  User: {
    profile: {
      settings: {
        theme: 'dark',
        language: 'en'
      },
      info: { age: 30 }
    }
  }
};

// Event registry input/output
export const eventModules = [
  { name: 'onSave', handler: () => 1 },
  { name: 'onSave', handler: () => 2 }
];
export const eventRegistry = {
  onSave: [expect.any(Function), expect.any(Function)]
};

// Advanced: Multiple event types and mixed handler arrays
export const advancedEventModules = [
  { name: 'onSave', handler: () => 1 },
  { name: 'onSave', handler: () => 2 },
  { name: 'onDelete', handler: () => 3 },
  { name: 'onDelete', handler: () => 4 },
  { name: 'onUpdate', handler: () => 5 }
];
export const advancedEventRegistry = {
  onSave: [expect.any(Function), expect.any(Function)],
  onDelete: [expect.any(Function), expect.any(Function)],
  onUpdate: [expect.any(Function)]
};

// Feature registry input/output
export const featureManifests = [
  { typeComposers: { A: {} }, queries: { qA: {} } },
  { typeComposers: { B: {} }, queries: { qB: {} } }
];
export const featureRegistry = {
  typeComposers: { A: {}, B: {} },
  queries: { qA: {}, qB: {} },
  mutations: {},
  resolvers: {}
};

// Advanced: Overlapping keys to test merge/override
export const overlappingFeatureManifests = [
  { typeComposers: { A: { foo: 1 } }, queries: { qA: { x: 1 } } },
  { typeComposers: { A: { bar: 2 } }, queries: { qA: { y: 2 } } }
];
export const overlappingFeatureRegistry = {
  typeComposers: { A: { foo: 1, bar: 2 } },
  queries: { qA: { x: 1, y: 2 } },
  mutations: {},
  resolvers: {}
};

// Edge cases: empty modules, missing keys, invalid types
export const emptyModules = [];
export const missingKeyModules = [
  { name: 'foo' }, // missing value/method/handler
  { value: 1 }     // missing name
];
export const invalidTypeModules = [
  null,
  undefined,
  42,
  'string',
  {},
  []
]; 