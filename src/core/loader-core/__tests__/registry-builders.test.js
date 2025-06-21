import {
  buildFlatRegistryByName,
  buildNamespacedRegistry,
  buildHierarchicalRegistry,
  buildEventRegistry,
  buildFeatureRegistries
} from '../lib/registry-builders.js';
import {
  flatModules, flatRegistry,
  namespacedModules, namespacedRegistry,
  hierarchicalModules, hierarchicalRegistry,
  deepHierarchicalModules, deepHierarchicalRegistry,
  eventModules, eventRegistry,
  advancedEventModules, advancedEventRegistry,
  featureManifests, featureRegistry,
  overlappingFeatureManifests, overlappingFeatureRegistry,
  emptyModules, missingKeyModules, invalidTypeModules
} from './lib/registryMocks.js';

describe('registry-builders.js', () => {
  describe('buildFlatRegistryByName', () => {
    it('builds flat registry from modules', () => {
      expect(buildFlatRegistryByName(flatModules)).toEqual(flatRegistry);
    });
    it('returns empty object for empty input', () => {
      expect(buildFlatRegistryByName(emptyModules)).toEqual({});
    });
    it('handles missing keys and invalid types', () => {
      expect(buildFlatRegistryByName(missingKeyModules)).toEqual({ foo: { name: 'foo' } });
      expect(buildFlatRegistryByName(invalidTypeModules)).toEqual({});
    });
    it('last duplicate name wins', () => {
      const mods = [
        { name: 'dup', value: 1 },
        { name: 'dup', value: 2 }
      ];
      expect(buildFlatRegistryByName(mods)).toEqual({ dup: { name: 'dup', value: 2 } });
    });
    it('handles null/undefined in array', () => {
      expect(buildFlatRegistryByName([null, undefined, { name: 'foo', value: 1 }])).toEqual({ foo: { name: 'foo', value: 1 } });
    });
  });

  describe('buildNamespacedRegistry', () => {
    it('builds namespaced registry from modules', () => {
      const result = buildNamespacedRegistry(namespacedModules);
      expect(result.ns1.foo).toEqual(expect.any(Function));
      expect(result.ns2.bar).toEqual(expect.any(Function));
    });
    it('returns empty object for empty input', () => {
      expect(buildNamespacedRegistry(emptyModules)).toEqual({});
    });
    it('handles missing keys and invalid types', () => {
      expect(buildNamespacedRegistry(missingKeyModules)).toEqual({});
      expect(buildNamespacedRegistry(invalidTypeModules)).toEqual({});
    });
    it('last duplicate (namespace, name) wins', () => {
      const mods = [
        { namespace: 'ns', name: 'dup', method: () => 1 },
        { namespace: 'ns', name: 'dup', method: () => 2 }
      ];
      const result = buildNamespacedRegistry(mods);
      expect(result.ns.dup).toEqual(expect.any(Function));
    });
    it('handles null/undefined in array', () => {
      expect(buildNamespacedRegistry([null, undefined, { namespace: 'ns', name: 'foo', method: () => 1 }])).toMatchObject({ ns: { foo: expect.any(Function) } });
    });
  });

  describe('buildHierarchicalRegistry', () => {
    it('builds hierarchical registry from modules', () => {
      expect(buildHierarchicalRegistry(hierarchicalModules)).toMatchObject(hierarchicalRegistry);
    });
    it('builds deeply nested hierarchical registry', () => {
      expect(buildHierarchicalRegistry(deepHierarchicalModules)).toEqual(deepHierarchicalRegistry);
    });
    it('returns empty object for empty input', () => {
      expect(buildHierarchicalRegistry(emptyModules)).toEqual({});
    });
    it('handles missing keys and invalid types', () => {
      expect(buildHierarchicalRegistry(missingKeyModules)).toEqual({ foo: undefined });
      expect(buildHierarchicalRegistry(invalidTypeModules)).toEqual({});
    });
    it('last duplicate path wins', () => {
      const mods = [
        { name: 'A.B', value: 1 },
        { name: 'A.B', value: 2 }
      ];
      expect(buildHierarchicalRegistry(mods)).toEqual({ A: { B: 2 } });
    });
    it('handles null/undefined in array', () => {
      expect(buildHierarchicalRegistry([null, undefined, { name: 'A.B', value: 1 }])).toEqual({ A: { B: 1 } });
    });
    it('handles empty string in path', () => {
      expect(buildHierarchicalRegistry([{ name: '', value: 1 }])).toEqual({ '': 1 });
    });
  });

  describe('buildEventRegistry', () => {
    it('builds event registry from modules', () => {
      expect(buildEventRegistry(eventModules)).toMatchObject(eventRegistry);
    });
    it('builds advanced event registry', () => {
      expect(buildEventRegistry(advancedEventModules)).toMatchObject(advancedEventRegistry);
    });
    it('returns empty object for empty input', () => {
      expect(buildEventRegistry(emptyModules)).toEqual({});
    });
    it('handles missing keys and invalid types', () => {
      expect(buildEventRegistry(missingKeyModules)).toEqual({});
      expect(buildEventRegistry(invalidTypeModules)).toEqual({});
    });
    it('last duplicate handler wins in array order', () => {
      const mods = [
        { name: 'evt', handler: () => 1 },
        { name: 'evt', handler: () => 2 }
      ];
      const result = buildEventRegistry(mods);
      expect(result.evt.length).toBe(2);
      expect(result.evt[0]).toEqual(expect.any(Function));
      expect(result.evt[1]).toEqual(expect.any(Function));
    });
    it('handles null/undefined in array', () => {
      expect(buildEventRegistry([null, undefined, { name: 'evt', handler: () => 1 }])).toMatchObject({ evt: [expect.any(Function)] });
    });
    it('ignores handler not a function', () => {
      const mods = [
        { name: 'evt', handler: 42 },
        { name: 'evt', handler: () => 2 }
      ];
      const result = buildEventRegistry(mods);
      expect(result.evt).toHaveLength(1);
      expect(result.evt[0]).toEqual(expect.any(Function));
    });
  });

  describe('buildFeatureRegistries', () => {
    it('builds feature registry from manifests', () => {
      expect(buildFeatureRegistries(featureManifests)).toEqual(featureRegistry);
    });
    it('merges overlapping feature manifests (deep merge)', () => {
      expect(buildFeatureRegistries(overlappingFeatureManifests)).toEqual(overlappingFeatureRegistry);
    });
    it('returns empty registries for empty input', () => {
      expect(buildFeatureRegistries(emptyModules)).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
    });
    it('handles missing keys and invalid types', () => {
      expect(buildFeatureRegistries(missingKeyModules)).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
      expect(buildFeatureRegistries(invalidTypeModules)).toEqual({ typeComposers: {}, queries: {}, mutations: {}, resolvers: {} });
    });
    it('handles null/undefined in manifests array', () => {
      expect(buildFeatureRegistries([null, undefined, ...featureManifests])).toEqual(featureRegistry);
    });
    it('handles null/undefined in registry keys', () => {
      const manifests = [
        { typeComposers: null, queries: undefined },
        { typeComposers: { A: {} }, queries: { qA: {} } }
      ];
      expect(buildFeatureRegistries(manifests)).toEqual({
        typeComposers: { A: {} },
        queries: { qA: {} },
        mutations: {},
        resolvers: {}
      });
    });
  });
}); 