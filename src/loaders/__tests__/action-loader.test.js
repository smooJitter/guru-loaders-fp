// LEGACY: This test suite is for the legacy action-loader. Only the { name, methods } pattern is supported.
// For modern patterns, see action-loader-2 tests.
//

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import actionLoader from '../action-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockContext = { logger: mockLogger, services: { logger: mockLogger } };

const legacyModule = (name, fn) => ({ name, methods: { [name]: fn } });

describe('action-loader (LEGACY)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers actions (happy path)', async () => {
    const mods = [
      legacyModule('fooAction', ({ x }) => x + 1),
      legacyModule('barAction', ({ y }) => y * 2)
    ];
    const { context: result } = await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(result.actions.fooAction).toBeDefined();
    expect(typeof result.actions.fooAction.method).toBe('function');
    expect(result.actions.fooAction.method({ x: 2 })).toBe(3);
    expect(result.actions.barAction.method({ y: 3 })).toBe(6);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('warns on duplicate action names', async () => {
    const mods = [
      legacyModule('fooAction', ({ x }) => x + 1),
      legacyModule('fooAction', ({ x }) => x + 2)
    ];
    await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('logs error if no valid actions found', async () => {
    const mods = [{ name: 'bad', methods: {} }];
    await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('skips non-object modules and logs debug', async () => {
    const logger = { debug: jest.fn(), error: jest.fn() };
    const ctx = { services: { logger } };
    const mods = [42];
    await actionLoader({ ...ctx, actions: {} }, mods);
    expect(logger.debug).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('logs error if missing name or methods', async () => {
    const mods = [
      { methods: { foo: () => 1 } }, // missing name
      { name: 'bar' } // missing methods
    ];
    await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('ignores non-function method values', async () => {
    const mods = [
      { name: 'foo', methods: { foo: 123, bar: null } }
    ];
    const { context: result } = await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(result.actions.foo).toBeDefined();
    expect(result.actions.foo.method).toBeUndefined();
  });

  it('handles empty modules array', async () => {
    const { context: result } = await actionLoader({ ...mockContext, actions: {} }, []);
    expect(result.actions).toEqual({});
  });

  it('handles large module arrays efficiently', async () => {
    const mods = Array.from({ length: 1000 }, (_, i) => legacyModule(`action${i}`, ({ x }) => x + i));
    const { context: result } = await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(Object.keys(result.actions)).toHaveLength(1000);
    expect(result.actions.action500.method({ x: 1 })).toBe(501);
  });

  it('logs error if methods object contains only non-function values', async () => {
    const mods = [
      { name: 'badAction', methods: { foo: 123, bar: null } }
    ];
    await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('No valid action functions found'),
      expect.objectContaining({ name: 'badAction' })
    );
  });

  it('logs error for module with methods: null', async () => {
    const mods = [
      { name: 'badAction', methods: null }
    ];
    await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid module shape'),
      expect.objectContaining({ name: 'badAction' })
    );
  });

  it('returns empty registry if modules is not an array', async () => {
    const { context: result } = await actionLoader({ ...mockContext, actions: {} }, null);
    expect(result.actions).toEqual({});
  });

  it('registers only function-valued methods', async () => {
    const mods = [
      { name: 'mixedAction', methods: { foo: () => 1, bar: 123, baz: null } }
    ];
    const { context: result } = await actionLoader({ ...mockContext, actions: {} }, mods);
    expect(result.actions.mixedAction).toBeDefined();
    expect(typeof result.actions.mixedAction.method).toBe('function');
  });

  it('injects context and actions into the action method', async () => {
    const testContext = { ...mockContext, actions: {} };
    const mods = [
      { name: 'ctxAction', methods: {
        foo: ({ context, actions, value }) => {
          expect(context).toBe(testContext);
          expect(actions.ctxAction).toBeDefined();
          return value + 1;
        }
      } }
    ];
    const { context: result } = await actionLoader(testContext, mods);
    expect(result.actions.ctxAction.method({ value: 2 })).toBe(3);
  });

  // If context injection is supported in legacy, add a test here
}); 