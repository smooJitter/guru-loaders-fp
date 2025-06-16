import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getActionsFromModule, validateActionModule } from '../action-loader-utils.js';

describe('getActionsFromModule', () => {
  let logger, ctx;
  beforeEach(() => {
    logger = { debug: jest.fn(), warn: jest.fn() };
    ctx = { services: { logger } };
  });

  it('returns empty object and logs debug for non-object module', () => {
    const result = getActionsFromModule(42, ctx);
    expect(result).toEqual({});
    expect(logger.debug).toHaveBeenCalled();
  });

  it('returns only default actions', () => {
    const mod = { default: { foo: () => 1, bar: () => 2 } };
    const result = getActionsFromModule(mod, ctx);
    expect(result.foo).toBeDefined();
    expect(result.bar).toBeDefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns only named actions', () => {
    const mod = { actions: { baz: () => 3 } };
    const result = getActionsFromModule(mod, ctx);
    expect(result.baz).toBeDefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns function-valued named exports', () => {
    const mod = { qux: () => 4, notAFunction: 123 };
    const result = getActionsFromModule(mod, ctx);
    expect(result.qux).toBeDefined();
    expect(result.notAFunction).toBeUndefined();
  });

  it('warns if both default and named actions are present', () => {
    const mod = { default: { foo: () => 1 }, actions: { bar: () => 2 } };
    getActionsFromModule(mod, ctx);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Both default and named action exports found.')
    );
  });

  it('calls logger.debug with module and actions', () => {
    const mod = { default: { foo: () => 1 } };
    getActionsFromModule(mod, ctx);
    expect(logger.debug).toHaveBeenCalledWith(
      '[DEBUG getActionsFromModule] module:',
      expect.any(Object),
      'actions:',
      expect.any(Object)
    );
  });
});

describe('validateActionModule', () => {
  it('returns false for invalid module shape', () => {
    expect(validateActionModule('test', {})).toBe(false);
    expect(validateActionModule('test', { default: 123 })).toBe(false);
  });

  it('returns true for valid function default', () => {
    const mod = { default: () => [{ namespace: 'ns', name: 'foo', method: () => 1 }] };
    expect(validateActionModule('test', mod)).toBe(true);
  });

  it('returns true for valid array default', () => {
    const mod = { default: [{ namespace: 'ns', name: 'foo', method: () => 1 }] };
    expect(validateActionModule('test', mod)).toBe(true);
  });

  it('returns true for valid object default', () => {
    const mod = { default: { ns: { foo: () => 1 } } };
    expect(validateActionModule('test', mod)).toBe(true);
  });

  it('returns false if any action is missing required fields', () => {
    const mod = { default: [{ namespace: 'ns', name: 'foo' }] };
    expect(validateActionModule('test', mod)).toBe(false);
  });
}); 