import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getMethodsFromModule, validateMethodModule } from '../lib/method-loader-utils.js';

describe('getMethodsFromModule', () => {
  let logger, ctx;
  beforeEach(() => {
    logger = { debug: jest.fn(), warn: jest.fn() };
    ctx = { services: { logger } };
  });

  it('returns empty object and logs debug for non-object module', () => {
    const result = getMethodsFromModule(42, ctx);
    expect(result).toEqual({});
    expect(logger.debug).toHaveBeenCalled();
  });

  it('returns only default methods (object)', () => {
    const mod = { default: { foo: () => 1, bar: () => 2 } };
    const result = getMethodsFromModule(mod, ctx);
    expect(result.foo).toBeDefined();
    expect(result.bar).toBeDefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns only default method (function)', () => {
    const fn = () => 1;
    const mod = { default: fn };
    const result = getMethodsFromModule(mod, ctx);
    expect(result[fn.name || 'default']).toBe(fn);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns only named methods', () => {
    const mod = { methods: { baz: () => 3 } };
    const result = getMethodsFromModule(mod, ctx);
    expect(result.baz).toBeDefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns function-valued named exports', () => {
    const mod = { qux: () => 4, notAFunction: 123 };
    const result = getMethodsFromModule(mod, ctx);
    expect(result.qux).toBeDefined();
    expect(result.notAFunction).toBeUndefined();
  });

  it('warns if both default and named methods are present', () => {
    const mod = { default: { foo: () => 1 }, methods: { bar: () => 2 } };
    getMethodsFromModule(mod, ctx);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Both default and named method exports found.')
    );
  });

  it('calls logger.debug with module and methods', () => {
    const mod = { default: { foo: () => 1 } };
    getMethodsFromModule(mod, ctx);
    expect(logger.debug).toHaveBeenCalledWith(
      '[DEBUG getMethodsFromModule] module:',
      expect.any(Object),
      'methods:',
      expect.any(Object)
    );
  });
});

describe('validateMethodModule', () => {
  let logger, ctx;
  beforeEach(() => {
    logger = { error: jest.fn(), warn: jest.fn() };
    ctx = { services: { logger } };
  });

  it('returns false for invalid module shape', () => {
    expect(validateMethodModule({}, ctx)).toBe(false);
    expect(validateMethodModule({ default: 123 }, ctx)).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns true for valid function default', () => {
    const mod = { default: () => 1 };
    expect(validateMethodModule(mod, ctx)).toBe(true);
  });

  it('returns true for valid object default', () => {
    const mod = { default: { foo: () => 1 } };
    expect(validateMethodModule(mod, ctx)).toBe(true);
  });

  it('returns true for valid named methods', () => {
    const mod = { methods: { foo: () => 1 } };
    expect(validateMethodModule(mod, ctx)).toBe(true);
  });

  it('warns if meta or options are not objects', () => {
    const mod = { default: { foo: () => 1 }, meta: 123, options: 'bad' };
    validateMethodModule(mod, ctx);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('meta should be an object'),
      123
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('options should be an object'),
      'bad'
    );
  });
}); 