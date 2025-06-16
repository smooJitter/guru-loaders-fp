// LEGACY: This test suite is for the legacy action-loader. Only the { name, methods } pattern is supported.
// For modern patterns, see action-loader-2 tests.
//

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import actionLoader from '../action-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  actions: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid action module
const validActionModule = { name: 'doSomething', methods: { action: jest.fn() } };
// Edge: duplicate name modules
const duplicateActionModuleA = { name: 'dupe', methods: { action: jest.fn() } };
const duplicateActionModuleB = { name: 'dupe', methods: { action: jest.fn() } };
// Failure: invalid action (missing name)
const invalidActionModule = { methods: { action: jest.fn() } };
// Failure: invalid action (not a function)
const invalidTypeActionModule = { name: 'bad', methods: { action: 42 } };

describe('actionLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid action object (happy path)', async () => {
    const ctx = baseContext();
    const modules = [validActionModule];
    const result = await actionLoader(ctx, modules);
    expect(result.context.actions.doSomething).toBeDefined();
    expect(typeof result.context.actions.doSomething.method).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate action names (edge case)', async () => {
    const ctx = baseContext();
    const modules = [duplicateActionModuleA, duplicateActionModuleB];
    const result = await actionLoader(ctx, modules);
    expect(result.context.actions.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid action objects (missing name) and does not register them (failure)', async () => {
    const ctx = baseContext();
    const modules = [invalidActionModule];
    const result = await actionLoader(ctx, modules);
    expect(result.context.actions).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid action objects (not a function) and does not register them (failure)', async () => {
    const ctx = baseContext();
    const modules = [invalidTypeActionModule];
    const result = await actionLoader(ctx, modules);
    expect(result.context.actions).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty modules array (edge case)', async () => {
    const ctx = baseContext();
    const modules = [];
    const result = await actionLoader(ctx, modules);
    expect(result.context.actions).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const ctx = baseContext();
    // Simulate a module that throws on access
    const errorModule = new Proxy({}, {
      get() { throw new Error('fail'); }
    });
    const modules = [errorModule];
    const result = await actionLoader(ctx, modules);
    expect(result.context.actions).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 