import { describe, it, expect } from '@jest/globals';
import { validateActionModule } from '../validateActionModule.js';

describe('validateActionModule', () => {
  it('returns false if mod.default is not function, array, or object', () => {
    expect(validateActionModule('actions', { default: null })).toBe(false);
    expect(validateActionModule('actions', { default: 42 })).toBe(false);
    expect(validateActionModule('actions', {})).toBe(false);
  });

  it('validates when mod.default is a function returning valid actions array', () => {
    const fn = () => [
      { namespace: 'ns', name: 'foo', method: () => {} },
      { namespace: 'ns', name: 'bar', method: () => {} }
    ];
    expect(validateActionModule('actions', { default: fn })).toBe(true);
  });

  it('fails if function returns invalid actions array', () => {
    const fn = () => [
      { namespace: 'ns', name: 'foo', method: 'notAFunction' }
    ];
    expect(validateActionModule('actions', { default: fn })).toBe(false);
  });

  it('validates when mod.default is an array of valid actions', () => {
    const arr = [
      { namespace: 'ns', name: 'foo', method: () => {} }
    ];
    expect(validateActionModule('actions', { default: arr })).toBe(true);
  });

  it('fails if array contains invalid action', () => {
    const arr = [
      { namespace: 'ns', name: 'foo', method: 'notAFunction' }
    ];
    expect(validateActionModule('actions', { default: arr })).toBe(false);
  });

  it('validates when mod.default is an object of namespaces with valid actions', () => {
    const mod = {
      default: {
        ns1: {
          foo: () => {},
          bar: { method: () => {}, extra: 1 }
        },
        ns2: {
          baz: () => {}
        }
      }
    };
    expect(validateActionModule('actions', mod)).toBe(true);
  });

  it('fails if object contains invalid action', () => {
    const mod = {
      default: {
        ns1: {
          foo: 'notAFunction'
        }
      }
    };
    expect(validateActionModule('actions', mod)).toBe(false);
  });

  it('handles object with method object missing method property', () => {
    const mod = {
      default: {
        ns1: {
          foo: { extra: 1 }
        }
      }
    };
    expect(validateActionModule('actions', mod)).toBe(false);
  });
}); 