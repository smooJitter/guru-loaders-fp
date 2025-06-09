import { describe, it, expect } from '@jest/globals';
import { contextInjectionHook } from '../contextInjection.hook.js';

describe('contextInjectionHook', () => {
  it('injects context into module', () => {
    const module = { foo: 1 };
    const context = { bar: 2 };
    const result = contextInjectionHook(module, context);
    expect(result).toEqual({ foo: 1, context });
  });

  it('returns a new object', () => {
    const module = { a: 1 };
    const context = { b: 2 };
    const result = contextInjectionHook(module, context);
    expect(result).not.toBe(module);
  });
}); 