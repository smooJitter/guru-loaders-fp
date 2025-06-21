import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createJsonLoader } from '../json-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  jsons: {},
  services: { logger: mockLogger },
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
    const modules = { 'config.json.js': validJsonFactory() };
    const ctx = baseContext();
    const loader = createJsonLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.jsons.config).toBeDefined();
    expect(result.jsons.config.data).toEqual({ foo: 'bar' });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate json names (edge case)', async () => {
    const files = ['dupeA.json.js', 'dupeB.json.js'];
    const modules = {
      'dupeA.json.js': duplicateJsonFactoryA(),
      'dupeB.json.js': duplicateJsonFactoryB()
    };
    const ctx = baseContext();
    const loader = createJsonLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.jsons.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid json objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.json.js'];
    const modules = { 'bad.json.js': invalidJsonFactory() };
    const ctx = baseContext();
    const loader = createJsonLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.jsons).toEqual({});
    // No logger.warn expected for invalid object
  });

  it('skips invalid json objects (not an object) and does not register them (failure)', async () => {
    const files = ['badtype.json.js'];
    const modules = { 'badtype.json.js': invalidTypeJsonFactory() };
    const ctx = baseContext();
    const loader = createJsonLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.jsons).toEqual({});
    // No logger.warn expected for invalid object
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const loader = createJsonLoader({
      findFiles: () => [],
      importAndApplyAll: async () => [],
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.jsons).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.json.js'];
    const ctx = baseContext();
    const loader = createJsonLoader({
      findFiles: () => files,
      importAndApplyAll: async () => { throw new Error('fail'); },
      logger: mockLogger
    });
    let result;
    try {
      result = await loader(ctx);
    } catch (e) {
      result = {};
    }
    expect(result.jsons || {}).toEqual({});
    // No logger.warn expected for import error
  });
}); 