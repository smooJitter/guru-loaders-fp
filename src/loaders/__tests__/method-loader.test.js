// LEGACY: This test suite is for the legacy method-loader. Only the { name, methods } pattern is supported.
// For modern patterns, see handler-loader tests.
//

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import methodLoader from '../method-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockContext = { logger: mockLogger, services: { logger: mockLogger } };

const legacyModule = (name, fn) => ({ name, methods: { [name]: fn } });

describe('method-loader (LEGACY)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers methods (happy path)', async () => {
    const mods = [
      legacyModule('fooMethod', ({ x }) => x * 2),
      legacyModule('barMethod', ({ y }) => y + 3)
    ];
    const { context: result } = await methodLoader({ ...mockContext, methods: {} }, mods);
    expect(result.methods.fooMethod).toBeDefined();
    expect(typeof result.methods.fooMethod.method).toBe('function');
    expect(result.methods.fooMethod.method({ x: 2 })).toBe(4);
    expect(result.methods.barMethod.method({ y: 3 })).toBe(6);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('warns on duplicate method names', async () => {
    const mods = [
      legacyModule('fooMethod', ({ x }) => x * 2),
      legacyModule('fooMethod', ({ x }) => x * 3)
    ];
    await methodLoader({ ...mockContext, methods: {} }, mods);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('logs error if no valid methods found', async () => {
    const mods = [{ name: 'bad', methods: {} }];
    await methodLoader({ ...mockContext, methods: {} }, mods);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('skips non-object modules and logs debug', async () => {
    const logger = { debug: jest.fn(), error: jest.fn() };
    const ctx = { services: { logger } };
    const mods = [42];
    await methodLoader({ ...ctx, methods: {} }, mods);
    expect(logger.debug).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('logs error if missing name or methods', async () => {
    const mods = [
      { methods: { foo: () => 1 } }, // missing name
      { name: 'bar' } // missing methods
    ];
    await methodLoader({ ...mockContext, methods: {} }, mods);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('ignores non-function method values', async () => {
    const mods = [
      { name: 'foo', methods: { foo: 123, bar: null } }
    ];
    const { context: result } = await methodLoader({ ...mockContext, methods: {} }, mods);
    expect(result.methods.foo).toBeDefined();
    expect(result.methods.foo.method).toBeUndefined();
  });

  it('handles empty modules array', async () => {
    const { context: result } = await methodLoader({ ...mockContext, methods: {} }, []);
    expect(result.methods).toEqual({});
  });

  it('handles large module arrays efficiently', async () => {
    const mods = Array.from({ length: 1000 }, (_, i) => legacyModule(`method${i}`, ({ x }) => x * i));
    const { context: result } = await methodLoader({ ...mockContext, methods: {} }, mods);
    expect(Object.keys(result.methods)).toHaveLength(1000);
    expect(result.methods.method500.method({ x: 2 })).toBe(1000);
  });

  // If context injection is supported in legacy, add a test here
}); 