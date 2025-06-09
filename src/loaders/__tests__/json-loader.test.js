import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createJsonLoader } from '../json-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger }, config: { foo: 'bar' } };

// Happy path: valid JSON factory
const validJsonFactory = jest.fn(() => ({
  name: 'userConfig',
  data: {
    maxUsers: 100,
    roles: ['admin', 'user', 'guest']
  },
  options: { cache: true }
}));

// Edge: duplicate name factories
const duplicateJsonFactoryA = jest.fn(() => ({ name: 'dupeConfig', data: { a: 1 } }));
const duplicateJsonFactoryB = jest.fn(() => ({ name: 'dupeConfig', data: { b: 2 } }));

// Failure: invalid JSON (missing name)
const invalidJsonFactory = jest.fn(() => ({ data: { foo: 'bar' } }));

describe('createJsonLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers a valid JSON object from a factory (happy path)', async () => {
    const files = ['user-config.json.js'];
    const modules = { 'user-config.json.js': { default: validJsonFactory } };
    const loader = createJsonLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        const result = modules[file];
        // Debug log
        // eslint-disable-next-line no-console
        console.log(`[importModule] file: ${file}, result:`, JSON.stringify(result));
        return result;
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, json: {} });
    expect(result.jsons).toBeDefined();
    expect(result.jsons.userConfig).toMatchObject({
      name: 'userConfig',
      data: { maxUsers: 100, roles: ['admin', 'user', 'guest'] },
      options: { cache: true },
      type: 'json'
    });
    expect(result.jsons.userConfig.timestamp).toEqual(expect.any(Number));
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate JSON names (edge case)', async () => {
    const files = ['dupeA.json.js', 'dupeB.json.js'];
    const modules = {
      'dupeA.json.js': { default: duplicateJsonFactoryA },
      'dupeB.json.js': { default: duplicateJsonFactoryB }
    };
    const loader = createJsonLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        const result = modules[file];
        // Debug log
        // eslint-disable-next-line no-console
        console.log(`[importModule] file: ${file}, result:`, JSON.stringify(result));
        return result;
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, json: {} });
    expect(result.jsons.dupeConfig).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith('[json-loader] Duplicate JSON names found:', ['dupeConfig']);
  });

  it('skips invalid JSON objects and does not register them (failure)', async () => {
    const files = ['bad.json.js'];
    const modules = { 'bad.json.js': { default: invalidJsonFactory } };
    const loader = createJsonLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        const result = modules[file];
        // Debug log
        // eslint-disable-next-line no-console
        console.log(`[importModule] file: ${file}, result:`, JSON.stringify(result));
        return result;
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, json: {} });
    expect(result.jsons).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 