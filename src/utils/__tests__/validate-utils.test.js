import { describe, it, expect } from '@jest/globals';
import * as validate from '../validate-utils.js';

describe('validateModule', () => {
  it('validates model, tc, actions, resolvers (happy path)', () => {
    expect(validate.validateModule('model', { name: 'm', schema: {}, model: () => {} })).toBeTruthy();
    expect(validate.validateModule('tc', { name: 't', schema: {}, tc: {} })).toBeTruthy();
    expect(validate.validateModule('actions', { name: 'a', methods: {} })).toBeTruthy();
    expect(validate.validateModule('resolvers', { name: 'r', methods: {} })).toBeTruthy();
  });
  it('returns false for missing fields or wrong types', () => {
    expect(validate.validateModule('model', { name: 'm', schema: {} })).toBeFalsy();
    expect(validate.validateModule('tc', { name: 't', tc: {} })).toBeFalsy();
    expect(validate.validateModule('actions', { name: '', methods: {} })).toBeFalsy();
    expect(validate.validateModule('actions', { name: 'a', methods: null })).toBeFalsy();
    expect(validate.validateModule('resolvers', { name: 1, methods: {} })).toBeFalsy();
    expect(validate.validateModule('unknown', {})).toBeFalsy();
  });
  it('returns false for undefined type', () => {
    expect(validate.validateModule(undefined, { foo: 1 })).toBe(false);
  });
});

describe('validateContext', () => {
  it('returns context if all required keys are present', () => {
    const ctx = { a: 1, b: 2 };
    expect(validate.validateContext(['a', 'b'], ctx)).toBe(ctx);
  });
  it('rejects if required keys are missing', async () => {
    const ctx = { a: 1 };
    await expect(validate.validateContext(['a', 'b'], ctx)).rejects.toThrow('Missing context: b');
  });
  it('returns context if required is empty', () => {
    const ctx = { a: 1 };
    expect(validate.validateContext([], ctx)).toBe(ctx);
  });
});

describe('detectCircularDeps', () => {
  it('returns false for no cycles', () => {
    const modules = [
      { name: 'a', dependencies: ['b'] },
      { name: 'b', dependencies: [] }
    ];
    expect(validate.detectCircularDeps(modules)).toBe(false);
  });
  it('returns true for a simple cycle', () => {
    const modules = [
      { name: 'a', dependencies: ['b'] },
      { name: 'b', dependencies: ['a'] }
    ];
    expect(validate.detectCircularDeps(modules)).toBe(true);
  });
  it('returns true for a self-cycle', () => {
    const modules = [
      { name: 'a', dependencies: ['a'] }
    ];
    expect(validate.detectCircularDeps(modules)).toBe(true);
  });
  it('returns false for empty modules array', () => {
    expect(validate.detectCircularDeps([])).toBe(false);
  });
  it('handles modules missing dependencies field', () => {
    const modules = [
      { name: 'a' },
      { name: 'b', dependencies: ['a'] }
    ];
    expect(validate.detectCircularDeps(modules)).toBe(false);
  });
});

describe('validateDependencies', () => {
  it('returns true if all dependencies are present', async () => {
    const mod = { dependencies: ['a', 'b'] };
    const ctx = { a: 1, b: 2 };
    expect(await validate.validateDependencies(mod, ctx)).toBe(true);
  });
  it('rejects if dependencies are missing', async () => {
    const mod = { dependencies: ['a', 'b'] };
    const ctx = { a: 1 };
    await expect(validate.validateDependencies(mod, ctx)).rejects.toThrow('Missing dependencies: b');
  });
  it('returns true if no dependencies', async () => {
    const mod = {};
    const ctx = {};
    expect(await validate.validateDependencies(mod, ctx)).toBe(true);
  });
  it('returns true if dependencies is undefined', async () => {
    const mod = { name: 'foo' };
    const ctx = {};
    expect(await validate.validateDependencies(mod, ctx)).toBe(true);
  });
  it('returns true if dependencies is null', async () => {
    const mod = { name: 'foo', dependencies: null };
    const ctx = {};
    expect(await validate.validateDependencies(mod, ctx)).toBe(true);
  });
  it('returns true if dependencies is empty array', async () => {
    const mod = { name: 'foo', dependencies: [] };
    const ctx = {};
    expect(await validate.validateDependencies(mod, ctx)).toBe(true);
  });
});

describe('validateExports', () => {
  it('returns true for valid model/tc', async () => {
    expect(await validate.validateExports('model', { name: 'm', schema: {}, model: () => {} })).toBe(true);
    expect(await validate.validateExports('tc', { name: 't', schema: {}, tc: {} })).toBe(true);
  });
  it('rejects for missing model/tc fields', async () => {
    await expect(validate.validateExports('model', { name: 'm', schema: {} })).rejects.toThrow('Missing exports');
    await expect(validate.validateExports('tc', { name: 't', tc: {} })).rejects.toThrow('Missing exports');
  });
  it('returns true for valid actions/resolvers', async () => {
    expect(await validate.validateExports('actions', { name: 'a', methods: {} })).toBe(true);
    expect(await validate.validateExports('resolvers', { name: 'r', methods: {} })).toBe(true);
  });
  it('rejects for invalid actions/resolvers', async () => {
    await expect(validate.validateExports('actions', { name: '', methods: {} })).rejects.toThrow('Missing or invalid exports');
    await expect(validate.validateExports('actions', { name: 'a', methods: null })).rejects.toThrow('Missing or invalid exports');
    await expect(validate.validateExports('resolvers', { name: 1, methods: {} })).rejects.toThrow('Missing or invalid exports');
  });
  it('returns true for unknown type (no required fields)', async () => {
    expect(await validate.validateExports('unknown', {})).toBe(true);
  });
  it('returns true for type not in requiredExports', async () => {
    expect(await validate.validateExports('notype', { foo: 1 })).toBe(true);
  });
  it('rejects with all missing fields for model', async () => {
    await expect(validate.validateExports('model', {})).rejects.toThrow('Missing exports: name, schema, model');
  });
  it('rejects with all missing fields for tc', async () => {
    await expect(validate.validateExports('tc', {})).rejects.toThrow('Missing exports: name, schema, tc');
  });
}); 