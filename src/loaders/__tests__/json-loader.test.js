import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { jsonLoader } from '../json-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  jsons: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid json factory
const validJsonFactory = jest.fn(() => ({ name: 'config', data: { foo: 'bar' } }));

// Edge: duplicate name factories
const duplicateJsonFactoryA = jest.fn(() => ({ name: 'dupe', data: { a: 1 } }));
const duplicateJsonFactoryB = jest.fn(() => ({ name: 'dupe', data: { b: 2 } }));

// Failure: invalid json (missing name)
const invalidJsonFactory = jest.fn(() => ({ data: { foo: 'bar' } }));
// Failure: invalid json (not an object)
const invalidTypeJsonFactory = jest.fn(() => 42);

describe('jsonLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid json object from a factory (happy path)', async () => {
    const files = ['config.json.js'];
    const modules = { 'config.json.js': { default: validJsonFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await jsonLoader(ctx);
    expect(result.jsons.config).toBeDefined();
    expect(result.jsons.config.data).toEqual({ foo: 'bar' });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate json names (edge case)', async () => {
    const files = ['dupeA.json.js', 'dupeB.json.js'];
    const modules = {
      'dupeA.json.js': { default: duplicateJsonFactoryA },
      'dupeB.json.js': { default: duplicateJsonFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await jsonLoader(ctx);
    expect(result.jsons.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid json objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.json.js'];
    const modules = { 'bad.json.js': { default: invalidJsonFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await jsonLoader(ctx);
    expect(result.jsons).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid json objects (not an object) and does not register them (failure)', async () => {
    const files = ['badtype.json.js'];
    const modules = { 'badtype.json.js': { default: invalidTypeJsonFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await jsonLoader(ctx);
    expect(result.jsons).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await jsonLoader(ctx);
    expect(result.jsons).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.json.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await jsonLoader(ctx);
    expect(result.jsons).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 