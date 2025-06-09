import { describe, it, expect } from '@jest/globals';
import { validationHook } from '../validation.hook.js';

describe('validationHook', () => {
  it('returns module if valid', () => {
    const module = { foo: 'bar', count: 2 };
    const schema = { foo: 'string', count: 'number' };
    const result = validationHook(module, schema);
    expect(result).toBe(module);
  });

  it('throws if module is invalid', () => {
    const module = { foo: 123, count: 2 };
    const schema = { foo: 'string', count: 'number' };
    expect(() => validationHook(module, schema)).toThrow('Module validation failed');
  });
}); 