import { describe, it, expect } from '@jest/globals';
import { createRegistry, mergeRegistries, createDependencyGraph, createContextFactory, createPipeline, transformModule } from '../registry-utils.js';

describe('registry-utils', () => {
  it('creates a registry from modules (happy path)', () => {
    const modules = [
      { name: 'foo', value: 123 },
      { name: 'bar', value: 456 }
    ];
    const registry = createRegistry('test')(modules);
    expect(registry.foo.value).toBe(123);
    expect(registry.bar.value).toBe(456);
  });

  it('merges multiple registries (edge case)', () => {
    const reg1 = { foo: { value: 1 } };
    const reg2 = { bar: { value: 2 } };
    const merged = mergeRegistries('test')([reg1, reg2]);
    expect(merged.foo.value).toBe(1);
    expect(merged.bar.value).toBe(2);
  });

  it('creates a dependency graph', () => {
    const modules = [
      { name: 'foo', dependencies: ['bar'] },
      { name: 'bar', dependencies: [] }
    ];
    const graph = createDependencyGraph(modules);
    expect(graph.foo).toEqual(['bar']);
    expect(graph.bar).toEqual([]);
  });

  it('createContextFactory merges defaults, services, registries', () => {
    const factory = createContextFactory({ a: 1 });
    const ctx = factory({ b: 2 }, { c: 3 });
    expect(ctx).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('createPipeline runs async steps in order', async () => {
    const steps = [
      async (ctx) => ({ ...ctx, a: 1 }),
      async (ctx) => ({ ...ctx, b: 2 })
    ];
    const pipeline = createPipeline(steps);
    const result = await pipeline({});
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('transformModule applies correct transformer for each type', () => {
    const now = Date.now();
    const model = transformModule('model', { foo: 1 });
    expect(model.type).toBe('model');
    expect(model.timestamp).toBeGreaterThanOrEqual(now);
    const tc = transformModule('tc', { foo: 2 });
    expect(tc.type).toBe('tc');
    const actions = transformModule('actions', { foo: 3 });
    expect(actions.type).toBe('actions');
    const resolvers = transformModule('resolvers', { foo: 4 });
    expect(resolvers.type).toBe('resolvers');
  });

  it('transformModule returns module unchanged for unknown type', () => {
    const mod = { foo: 1 };
    expect(transformModule('unknown', mod)).toBe(mod);
  });

  it('createRegistry handles empty modules array', () => {
    const registry = createRegistry('test')([]);
    expect(registry).toEqual({});
  });

  it('mergeRegistries handles empty input', () => {
    const merged = mergeRegistries('test')([]);
    expect(merged).toEqual({});
  });

  it('createDependencyGraph handles empty modules', () => {
    const graph = createDependencyGraph([]);
    expect(graph).toEqual({});
  });

  it('createRegistry skips modules missing name', () => {
    const modules = [
      { value: 1 },
      { name: 'foo', value: 2 }
    ];
    const registry = createRegistry('test')(modules);
    expect(registry.foo.value).toBe(2);
    expect(Object.keys(registry)).toHaveLength(1);
  });

  it('createRegistry handles duplicate names (last wins)', () => {
    const modules = [
      { name: 'foo', value: 1 },
      { name: 'foo', value: 2 }
    ];
    const registry = createRegistry('test')(modules);
    expect(registry.foo.value).toBe(2);
  });

  it('mergeRegistries deep merges overlapping keys', () => {
    const reg1 = { foo: { a: 1, nested: { x: 1 } } };
    const reg2 = { foo: { b: 2, nested: { y: 2 } } };
    const merged = mergeRegistries('test')([reg1, reg2]);
    expect(merged.foo.a).toBe(1);
    expect(merged.foo.b).toBe(2);
    expect(merged.foo.nested.x).toBe(1);
    expect(merged.foo.nested.y).toBe(2);
  });

  it('transformModule returns module unchanged for undefined/null type', () => {
    const mod = { foo: 1 };
    expect(transformModule(undefined, mod)).toBe(mod);
    expect(transformModule(null, mod)).toBe(mod);
  });

  it('transformModule works with module missing fields', () => {
    const mod = {};
    expect(transformModule('model', mod).type).toBe('model');
  });

  it('createDependencyGraph handles modules missing dependencies', () => {
    const modules = [
      { name: 'foo' },
      { name: 'bar', dependencies: ['foo'] }
    ];
    const graph = createDependencyGraph(modules);
    expect(graph.foo).toEqual([]);
    expect(graph.bar).toEqual(['foo']);
  });

  it('createDependencyGraph handles duplicate names (last wins)', () => {
    const modules = [
      { name: 'foo', dependencies: ['a'] },
      { name: 'foo', dependencies: ['b'] }
    ];
    const graph = createDependencyGraph(modules);
    expect(graph.foo).toEqual(['b']);
  });

  it('createContextFactory works with missing services/registries', () => {
    const factory = createContextFactory({ a: 1 });
    const ctx = factory({}, {});
    expect(ctx).toEqual({ a: 1 });
  });

  it('createPipeline resolves with context if steps is empty', async () => {
    const pipeline = createPipeline([]);
    const ctx = { a: 1 };
    expect(await pipeline(ctx)).toEqual(ctx);
  });

  it('createPipeline rejects if a step throws', async () => {
    const steps = [async (ctx) => { throw new Error('fail'); }];
    const pipeline = createPipeline(steps);
    await expect(pipeline({})).rejects.toThrow('fail');
  });
}); 