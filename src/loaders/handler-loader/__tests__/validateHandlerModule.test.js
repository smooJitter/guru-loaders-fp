import { describe, it, expect } from '@jest/globals';
import { validateHandlerModule } from '../validateHandlerModule.js';

describe('validateHandlerModule', () => {
  it('returns false if mod.default is not function, array, or object', () => {
    expect(validateHandlerModule('handlers', { default: null })).toBe(false);
    expect(validateHandlerModule('handlers', { default: 42 })).toBe(false);
    expect(validateHandlerModule('handlers', {})).toBe(false);
  });

  it('validates when mod.default is a function returning valid handlers array', () => {
    const fn = () => [
      { namespace: 'ns', name: 'foo', method: () => {} },
      { namespace: 'ns', name: 'bar', method: () => {} }
    ];
    expect(validateHandlerModule('handlers', { default: fn })).toBe(true);
  });

  it('fails if function returns invalid handlers array', () => {
    const fn = () => [
      { namespace: 'ns', name: 'foo', method: 'notAFunction' }
    ];
    expect(validateHandlerModule('handlers', { default: fn })).toBe(false);
  });

  it('validates when mod.default is an array of valid handlers', () => {
    const arr = [
      { namespace: 'ns', name: 'foo', method: () => {} }
    ];
    expect(validateHandlerModule('handlers', { default: arr })).toBe(true);
  });

  it('fails if array contains invalid handler', () => {
    const arr = [
      { namespace: 'ns', name: 'foo', method: 'notAFunction' }
    ];
    expect(validateHandlerModule('handlers', { default: arr })).toBe(false);
  });

  it('validates when mod.default is an object of namespaces with valid handlers', () => {
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
    expect(validateHandlerModule('handlers', mod)).toBe(true);
  });

  it('fails if object contains invalid handler', () => {
    const mod = {
      default: {
        ns1: {
          foo: 'notAFunction'
        }
      }
    };
    expect(validateHandlerModule('handlers', mod)).toBe(false);
  });

  it('handles object with method object missing method property', () => {
    const mod = {
      default: {
        ns1: {
          foo: { extra: 1 }
        }
      }
    };
    expect(validateHandlerModule('handlers', mod)).toBe(false);
  });
}); 